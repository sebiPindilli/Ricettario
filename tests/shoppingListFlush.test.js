// Verifica la lista spesa (Fase C, stesso disegno del documento system —
// vedi systemFlush.test.js) contro l'emulator Firestore locale — non il
// progetto di produzione. Si esegue con `npm run test:rules`.
//
// Il punto specifico da verificare qui, in più rispetto a system: la
// migrazione dal formato storico (array) al nuovo formato (mappa per id,
// necessario per il rilevamento conflitti a grana di singola voce) deve
// avvenire SENZA perdere voci esistenti, anche con scritture concorrenti,
// e l'ordine (per id — vedi sortEntriesById in bookStore.js) deve restare
// stabile e corretto anche quando le voci arrivano da client diversi.
//
// Riproduce QUI (non importa da src/services/bookStore.js) l'algoritmo di
// saveShoppingEntriesOnline/Offline: quel modulo importa ../firebase.js
// (il progetto reale), userebbe Firestore vero invece dell'emulator —
// stessa ragione di systemFlush.test.js/recipeFlush.test.js.
// diffShoppingEntries/shoppingEntriesToMap/deepEqual sono invece pura
// logica (nessuna dipendenza da Firestore): importati per davvero.
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { initializeTestEnvironment, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, runTransaction, deleteField } from "firebase/firestore";
import { diffShoppingEntries, shoppingEntriesToMap, deepEqual } from "../src/utils/dirtyTracking.js";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ricettario-shoppinglist-test",
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} { allow read, write: if true; }
          }
        }
      `,
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const dbFor = () => testEnv.unauthenticatedContext().firestore();
const shoppingListRef = (db, bookId) => doc(db, "books", bookId, "shoppingList", "data");

const entry = (id, extra = {}) => ({ id, recipeId: `r-${id}`, recipeTitle: `Ricetta ${id}`, items: [], selectedNames: [], ...extra });

const sortEntriesByIdLocal = (entries) => [...entries].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

const saveEntriesOfflineLocal = async (db, bookId, changed, removedIds) => {
  const ref = shoppingListRef(db, bookId);
  const snap = await getDoc(ref);
  const raw = snap.exists() ? snap.data().entries : {};
  if (Array.isArray(raw)) return { skipped: true };

  const payload = {};
  changed.forEach((e) => { payload[e.id] = e; });
  removedIds.forEach((id) => { payload[id] = deleteField(); });
  await setDoc(ref, { entries: payload }, { merge: true });
  return { skipped: false };
};

const saveEntriesOnlineLocal = async (db, bookId, baseline, changed, removedIds) => {
  const ref = shoppingListRef(db, bookId);
  const conflicts = {};

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const raw = snap.exists() ? snap.data().entries : {};
    const needsMigration = Array.isArray(raw);
    const serverMap = needsMigration ? Object.fromEntries(raw.map((e) => [e.id, e])) : (raw || {});

    const toWrite = {};
    changed.forEach((e) => {
      if (deepEqual(serverMap[e.id], baseline?.get?.(e.id))) toWrite[e.id] = e;
      else conflicts[e.id] = serverMap[e.id];
    });
    removedIds.forEach((id) => {
      if (deepEqual(serverMap[id], baseline?.get?.(id))) toWrite[id] = null;
      else conflicts[id] = serverMap[id];
    });

    if (needsMigration) {
      const finalEntries = { ...serverMap };
      Object.entries(toWrite).forEach(([id, val]) => {
        if (val === null) delete finalEntries[id]; else finalEntries[id] = val;
      });
      transaction.set(ref, { entries: finalEntries }, { merge: true });
    } else if (Object.keys(toWrite).length > 0) {
      const payload = {};
      Object.entries(toWrite).forEach(([id, val]) => { payload[id] = val === null ? deleteField() : val; });
      transaction.set(ref, { entries: payload }, { merge: true });
    }
  });

  return { conflicts };
};

const readNormalized = async (db, bookId) => {
  const snap = await getDoc(shoppingListRef(db, bookId));
  if (!snap.exists()) return [];
  const raw = snap.data().entries;
  return Array.isArray(raw) ? raw : sortEntriesByIdLocal(Object.values(raw || {}));
};

describe("lista spesa — migrazione array → mappa", () => {
  it("una scrittura online su un documento ancora array lo converte senza perdere voci esistenti", async () => {
    const db = dbFor();
    const bookId = "book1";
    const legacyEntries = [entry("a1"), entry("a2"), entry("a3")];
    await assertSucceeds(setDoc(shoppingListRef(db, bookId), { entries: legacyEntries }));

    // Client con una baseline vuota (non ha ancora letto il documento
    // legacy) aggiunge una nuova voce
    const baseline = new Map();
    const newEntry = entry("a4");
    await saveEntriesOnlineLocal(db, bookId, baseline, [newEntry], []);

    const data = await readNormalized(db, bookId);
    expect(data.map((e) => e.id).sort()).toEqual(["a1", "a2", "a3", "a4"]);
  });

  it("scrittura offline su documento non ancora migrato: nessuna scrittura tentata (skipped)", async () => {
    const db = dbFor();
    const bookId = "book1";
    await assertSucceeds(setDoc(shoppingListRef(db, bookId), { entries: [entry("a1")] }));

    const { skipped } = await saveEntriesOfflineLocal(db, bookId, [entry("a2")], []);
    expect(skipped).toBe(true);

    // Il documento resta invariato: nessuna scrittura parziale/corrotta
    const snap = await getDoc(shoppingListRef(db, bookId));
    expect(Array.isArray(snap.data().entries)).toBe(true);
    expect(snap.data().entries).toEqual([entry("a1")]);
  });
});

describe("lista spesa — conflitti multi-utente (documento già in formato mappa)", () => {
  it("voci diverse, concorrenti: entrambe sopravvivono", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = [entry("a1"), entry("a2")];
    await assertSucceeds(setDoc(shoppingListRef(db, bookId), { entries: Object.fromEntries(baseline.map((e) => [e.id, e])) }));
    const baselineMap = shoppingEntriesToMap(baseline);

    // Client 1 spunta un articolo in a1
    const a1Updated = { ...baseline[0], selectedNames: ["farina"] };
    const diff1 = diffShoppingEntries(baselineMap, [a1Updated, baseline[1]]);
    const { conflicts: c1 } = await saveEntriesOnlineLocal(db, bookId, baselineMap, diff1.changed, diff1.removedIds);
    expect(c1).toEqual({});

    // Client 2, ignaro di Client 1, tocca a2 (voce diversa)
    const a2Updated = { ...baseline[1], selectedNames: ["zucchero"] };
    const diff2 = diffShoppingEntries(baselineMap, [baseline[0], a2Updated]);
    const { conflicts: c2 } = await saveEntriesOnlineLocal(db, bookId, baselineMap, diff2.changed, diff2.removedIds);
    expect(c2).toEqual({});

    const data = await readNormalized(db, bookId);
    const byId = Object.fromEntries(data.map((e) => [e.id, e]));
    expect(byId.a1.selectedNames).toEqual(["farina"]);
    expect(byId.a2.selectedNames).toEqual(["zucchero"]);
  });

  it("stessa voce, concorrente: la seconda scrittura viene rifiutata, nessun dato corrotto", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = [entry("a1")];
    await assertSucceeds(setDoc(shoppingListRef(db, bookId), { entries: Object.fromEntries(baseline.map((e) => [e.id, e])) }));
    const baselineMap = shoppingEntriesToMap(baseline);

    const c1Version = { ...baseline[0], selectedNames: ["client1"] };
    const c2Version = { ...baseline[0], selectedNames: ["client2"] };

    const diff1 = diffShoppingEntries(baselineMap, [c1Version]);
    const { conflicts: conflicts1 } = await saveEntriesOnlineLocal(db, bookId, baselineMap, diff1.changed, diff1.removedIds);
    expect(conflicts1).toEqual({});

    // Client 2 usa ancora la baseline vecchia (non sa che client1 ha già scritto)
    const diff2 = diffShoppingEntries(baselineMap, [c2Version]);
    const { conflicts: conflicts2 } = await saveEntriesOnlineLocal(db, bookId, baselineMap, diff2.changed, diff2.removedIds);
    expect(conflicts2.a1).toEqual(c1Version);

    const data = await readNormalized(db, bookId);
    expect(data).toEqual([c1Version]); // mai un mix/corruzione tra le due versioni
  });

  it("rimozione di una voce in conflitto con una modifica concorrente: rifiutata, nessuna perdita silenziosa", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = [entry("a1")];
    await assertSucceeds(setDoc(shoppingListRef(db, bookId), { entries: Object.fromEntries(baseline.map((e) => [e.id, e])) }));
    const baselineMap = shoppingEntriesToMap(baseline);

    // Client 1 modifica a1 (es. spunta un articolo)
    const updated = { ...baseline[0], selectedNames: ["farina"] };
    const diff1 = diffShoppingEntries(baselineMap, [updated]);
    await saveEntriesOnlineLocal(db, bookId, baselineMap, diff1.changed, diff1.removedIds);

    // Client 2, ignaro, prova a RIMUOVERE a1 partendo dalla baseline vecchia
    const diff2 = diffShoppingEntries(baselineMap, []);
    const { conflicts } = await saveEntriesOnlineLocal(db, bookId, baselineMap, diff2.changed, diff2.removedIds);
    expect(conflicts.a1).toEqual(updated);

    // La voce resta (con la modifica di client1), non viene rimossa a sorpresa
    const data = await readNormalized(db, bookId);
    expect(data).toEqual([updated]);
  });
});

describe("lista spesa — ordine stabile per id sotto inserimento concorrente", () => {
  it("voci aggiunte da client diversi, in ordine di scrittura invertito, restano ordinate per id (cronologico)", async () => {
    const db = dbFor();
    const bookId = "book1";
    // id generati come farebbe uid(): prefisso timestamp base36 crescente —
    // qui simulati esplicitamente in ordine cronologico "vero" a1 < a2 < a3.
    const early = entry("a1");
    const middle = entry("a2");
    const late = entry("a3");

    await assertSucceeds(setDoc(shoppingListRef(db, bookId), { entries: {} }));

    // Scritte in ordine DIVERSO da quello cronologico (late per primo,
    // simula due client che scrivono in momenti indipendenti/fuori sync)
    await saveEntriesOnlineLocal(db, bookId, new Map(), [late], []);
    await saveEntriesOnlineLocal(db, bookId, new Map(), [early], []);
    await saveEntriesOnlineLocal(db, bookId, new Map(), [middle], []);

    const data = await readNormalized(db, bookId);
    expect(data.map((e) => e.id)).toEqual(["a1", "a2", "a3"]); // ordine per id, non per arrivo
  });
});
