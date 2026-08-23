// Verifica il salvataggio del documento "system" (vedi flushSystemNow in
// src/ricettario-v23.jsx) contro l'emulator Firestore locale — non il
// progetto di produzione. Si esegue con `npm run test:rules`.
//
// Due gruppi di test:
// - "azione multi-campo" (sotto): un'azione come deleteIngredients tocca
//   7 campi insieme — anche con la scrittura a grana fine (Fase B, vedi in
//   fondo al file) deve restare un'unica scrittura coerente con tutti i
//   cambiamenti, mai applicata a metà.
// - "conflitti multi-utente" (in fondo al file): due client che scrivono
//   sullo stesso documento — campi/voci diverse sopravvivono entrambe,
//   la stessa voce genera un conflitto rilevato (mai un dato corrotto).
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { initializeTestEnvironment, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, collection, getDocs, runTransaction, deleteField } from "firebase/firestore";
import { diffSystemFields, deepEqual } from "../src/utils/dirtyTracking.js";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ricettario-system-test",
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
const systemRef = (db, bookId) => doc(db, "books", bookId, "system", "data");

// Firestore rifiuta gli array annidati: ignoredSimilarities è [[a,b], ...]
// in memoria ma va codificato come array di oggetti prima di scrivere —
// stessa logica di encodeIgnoredSimilarities/decodeIgnoredSimilarities in
// src/services/bookStore.js (non importabile qui: userebbe il progetto
// Firebase reale invece dell'emulator, vedi recipeFlush.test.js).
const encodeSystem = (system) => ({
  ...system,
  ignoredSimilarities: (system.ignoredSimilarities || []).map(([a, b]) => ({ a, b })),
});
const decodeSystem = (data) => ({
  ...data,
  ignoredSimilarities: (data.ignoredSimilarities || []).map((p) => [p.a, p.b]),
});

const baseSystem = () => ({
  extraTagGroups: [],
  sectionList: [{ id: "dolci", label: "Dolci" }],
  categoryList: [{ id: "base", label: "Ingredienti base" }],
  ingredientCategories: { zucchero: ["base"], farina: ["base"] },
  aggregates: [{ id: "agg1", name: "Zuccheri", members: ["zucchero", "farina"], categories: [] }],
  equivalences: { zucchero: { factors: { cucchiaio: 10 } } },
  customUnits: {},
  nutritionMap: { zucchero: { foodId: "f1" } },
  customFoods: [],
  ingredientDict: { zucchero: "Zucchero", farina: "Farina" },
  sourceByIngredient: { zucchero: ["ingredient"] },
  ignoredSimilarities: [["zucchero", "farina"]],
});

// Riproduce esattamente la trasformazione di deleteIngredients
// (ricettario-v23.jsx) su un'istantanea system: rimuove l'id da ogni mappa
// keyed per ingId, e lo filtra da aggregates/ignoredSimilarities.
const applyDeleteIngredients = (system, ids) => {
  const idSet = new Set(ids);
  const stripKeys = (obj) => {
    const next = { ...obj };
    idSet.forEach((id) => delete next[id]);
    return next;
  };
  return {
    ...system,
    ingredientDict: stripKeys(system.ingredientDict),
    ingredientCategories: stripKeys(system.ingredientCategories),
    sourceByIngredient: stripKeys(system.sourceByIngredient),
    equivalences: stripKeys(system.equivalences),
    nutritionMap: stripKeys(system.nutritionMap),
    aggregates: system.aggregates.map((a) => ({ ...a, members: (a.members || []).filter((m) => !idSet.has(m)) })),
    ignoredSimilarities: system.ignoredSimilarities.filter(([a, b]) => !idSet.has(a) && !idSet.has(b)),
  };
};

describe("flush system — ignoredSimilarities (bug preesistente, non introdotto da questo lavoro)", () => {
  it("un array annidato non codificato viene rifiutato da Firestore", async () => {
    const db = dbFor();
    const system = { ...baseSystem(), ignoredSimilarities: [["zucchero", "farina"]] };
    // Il SDK valida gli argomenti e lancia prima ancora di restituire la
    // promise (non un semplice reject) — try/catch cattura entrambi i casi.
    let error;
    try {
      await setDoc(systemRef(db, "book1"), system);
    } catch (e) {
      error = e;
    }
    expect(error?.message).toMatch(/[Nn]ested arrays/);
  });

  it("codificato come array di oggetti {a,b} → scrittura e lettura corrette", async () => {
    const db = dbFor();
    const bookId = "book1";
    const system = { ...baseSystem(), ignoredSimilarities: [["zucchero", "farina"], ["sale", "pepe"]] };
    await assertSucceeds(setDoc(systemRef(db, bookId), encodeSystem(system)));

    const snap = await getDoc(systemRef(db, bookId));
    const decoded = decodeSystem(snap.data());
    expect(decoded.ignoredSimilarities).toEqual([["zucchero", "farina"], ["sale", "pepe"]]);
  });
});

describe("flush system — azione multi-campo (deleteIngredients)", () => {
  it("una sola scrittura cattura tutti e 7 i campi toccati insieme", async () => {
    const db = dbFor();
    const bookId = "book1";
    const before = baseSystem();
    await assertSucceeds(setDoc(systemRef(db, bookId), encodeSystem(before)));

    // L'utente elimina "zucchero": deleteIngredients tocca 6 setter diversi
    // in un colpo solo — flushSystemNow scrive comunque UNA sola volta,
    // l'istantanea completa dopo il re-render.
    const after = applyDeleteIngredients(before, ["zucchero"]);
    await assertSucceeds(setDoc(systemRef(db, bookId), encodeSystem(after)));

    const snap = await getDoc(systemRef(db, bookId));
    const data = decodeSystem(snap.data());
    expect(data.ingredientDict).toEqual({ farina: "Farina" });
    expect(data.ingredientCategories).toEqual({ farina: ["base"] });
    expect(data.sourceByIngredient).toEqual({});
    expect(data.equivalences).toEqual({});
    expect(data.nutritionMap).toEqual({});
    expect(data.aggregates[0].members).toEqual(["farina"]);
    expect(data.ignoredSimilarities).toEqual([]);
    // I campi non toccati dall'azione restano comunque presenti e corretti
    // — la scrittura è dell'istantanea COMPLETA, non di un sottoinsieme.
    expect(data.sectionList).toEqual(before.sectionList);
    expect(data.categoryList).toEqual(before.categoryList);
  });
});

describe("flush system + ricette — azione che tocca entrambi (renameIngredient)", () => {
  it("il documento system e solo la ricetta interessata si aggiornano, indipendentemente", async () => {
    const db = dbFor();
    const bookId = "book1";
    const before = baseSystem();
    await assertSucceeds(setDoc(systemRef(db, bookId), encodeSystem(before)));

    const withIng = { id: "r1", title: "Torta", ingredients: [{ name: "zucchero", qty: 100, unit: "g" }] };
    const withoutIng = { id: "r2", title: "Pane", ingredients: [{ name: "acqua", qty: 300, unit: "ml" }] };
    await assertSucceeds(setDoc(doc(db, "books", bookId, "recipes", "r1"), withIng));
    await assertSucceeds(setDoc(doc(db, "books", bookId, "recipes", "r2"), withoutIng));

    // renameIngredient (dopo la correzione): rinomina nel dizionario (system)
    // E nella sola ricetta che contiene l'ingrediente.
    const afterSystem = { ...before, ingredientDict: { ...before.ingredientDict, zucchero: "Zucchero di canna" } };
    const renamedRecipe = { ...withIng, ingredients: [{ name: "zucchero di canna", qty: 100, unit: "g" }] };
    await assertSucceeds(setDoc(systemRef(db, bookId), encodeSystem(afterSystem)));
    await assertSucceeds(setDoc(doc(db, "books", bookId, "recipes", "r1"), renamedRecipe));

    const systemSnap = await getDoc(systemRef(db, bookId));
    expect(decodeSystem(systemSnap.data()).ingredientDict.zucchero).toBe("Zucchero di canna");

    const recipesSnap = await getDocs(collection(db, "books", bookId, "recipes"));
    const byId = Object.fromEntries(recipesSnap.docs.map((d) => [d.id, d.data()]));
    expect(byId.r1.ingredients[0].name).toBe("zucchero di canna");
    expect(byId.r2).toEqual(withoutIng); // non toccata: nessun ingrediente da rinominare
  });
});

// ══════════════════════════════════════════════════════════════
// Conflitti multi-utente (Fase B) — scrittura a grana fine online/offline.
//
// Riproduce QUI (non importa da src/services/bookStore.js) esattamente
// l'algoritmo di saveSystemEntriesOnline/Offline: quel modulo importa
// ../firebase.js (il progetto reale), userebbe Firestore vero invece
// dell'emulator — stessa ragione per cui recipeFlush.test.js reimplementa
// applyFlush invece di importare saveRecipe. diffSystemFields/deepEqual
// sono invece pura logica (nessuna dipendenza da Firestore): importati
// per davvero dal codice reale, non duplicati.
// ══════════════════════════════════════════════════════════════

const encodeEquivalenceEntryLocal = (eq) => {
  if (!eq) return eq;
  const factors = {};
  for (const [unit, grams] of Object.entries(eq.factors || {})) {
    factors[unit === "" ? "senzaunita" : unit] = grams;
  }
  return { ...eq, factors };
};
const decodeEquivalenceEntryLocal = (eq) => {
  if (!eq) return eq;
  const factors = {};
  for (const [unit, grams] of Object.entries(eq.factors || {})) {
    factors[unit === "senzaunita" ? "" : unit] = grams;
  }
  return { ...eq, factors };
};
const encodeIgnoredSimilaritiesLocal = (pairs) => (pairs || []).map(([a, b]) => ({ a, b }));
const decodeIgnoredSimilaritiesLocal = (pairs) => (pairs || []).map((p) => Array.isArray(p) ? p : [p.a, p.b]);

const buildEntriesPayload = (current, mapChanges, changedArrayFields) => {
  const payload = {};
  Object.entries(mapChanges).forEach(([field, { changed, removedKeys }]) => {
    const nested = {};
    Object.entries(changed).forEach(([key, value]) => {
      nested[key] = field === "equivalences" ? encodeEquivalenceEntryLocal(value) : value;
    });
    removedKeys.forEach((key) => { nested[key] = deleteField(); });
    payload[field] = nested;
  });
  changedArrayFields.forEach((field) => {
    payload[field] = field === "ignoredSimilarities" ? encodeIgnoredSimilaritiesLocal(current[field]) : current[field];
  });
  return payload;
};

// Percorso offline riprodotto: scrittura semplice mirata, nessun confronto.
const saveEntriesOfflineLocal = (db, bookId, current, mapChanges, changedArrayFields) =>
  setDoc(systemRef(db, bookId), buildEntriesPayload(current, mapChanges, changedArrayFields), { merge: true });

// Percorso online riprodotto: transazione, confronto per valore (deepEqual)
// contro la baseline, scrive solo ciò che combacia, il resto torna come
// conflitto col valore fresco del server.
const saveEntriesOnlineLocal = async (db, bookId, baseline, current, mapChanges, changedArrayFields) => {
  const ref = systemRef(db, bookId);
  const conflicts = { mapEntries: {}, arrayFields: [] };

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const server = snap.exists() ? snap.data() : {};
    const payload = {};

    Object.entries(mapChanges).forEach(([field, { changed, removedKeys }]) => {
      const serverField = server[field] || {};
      const decodeEntry = (v) => (field === "equivalences" ? decodeEquivalenceEntryLocal(v) : v);
      const nested = {};
      const conflictedKeys = {};

      Object.entries(changed).forEach(([key, value]) => {
        const serverValue = decodeEntry(serverField[key]);
        if (deepEqual(serverValue, baseline?.[field]?.[key])) {
          nested[key] = field === "equivalences" ? encodeEquivalenceEntryLocal(value) : value;
        } else {
          conflictedKeys[key] = serverValue;
        }
      });
      removedKeys.forEach((key) => {
        const serverValue = decodeEntry(serverField[key]);
        if (deepEqual(serverValue, baseline?.[field]?.[key])) nested[key] = deleteField();
        else conflictedKeys[key] = serverValue;
      });

      if (Object.keys(nested).length > 0) payload[field] = nested;
      if (Object.keys(conflictedKeys).length > 0) conflicts.mapEntries[field] = conflictedKeys;
    });

    changedArrayFields.forEach((field) => {
      const serverValue = field === "ignoredSimilarities"
        ? decodeIgnoredSimilaritiesLocal(server[field])
        : (server[field] || []);
      if (deepEqual(serverValue, baseline?.[field])) {
        payload[field] = field === "ignoredSimilarities" ? encodeIgnoredSimilaritiesLocal(current[field]) : current[field];
      } else {
        conflicts.arrayFields.push({ field, serverValue });
      }
    });

    if (Object.keys(payload).length > 0) transaction.set(ref, payload, { merge: true });
  });

  return { conflicts };
};

describe("conflitti multi-utente — campi diversi, concorrenti", () => {
  it("due client su chiavi diverse: entrambe le modifiche sopravvivono", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = baseSystem();
    await assertSucceeds(setDoc(systemRef(db, bookId), encodeSystem(baseline)));

    // Client 1: aggiunge un valore nutrizionale per pomodoro
    const c1 = { ...baseline, nutritionMap: { ...baseline.nutritionMap, pomodoro: { foodId: "f2" } } };
    const diff1 = diffSystemFields(baseline, c1);
    const { conflicts: conflicts1 } = await saveEntriesOnlineLocal(db, bookId, baseline, c1, diff1.mapChanges, diff1.changedArrayFields);
    expect(conflicts1.mapEntries).toEqual({});

    // Client 2: ignaro di Client 1, parte dalla STESSA baseline iniziale,
    // tocca una chiave diversa in un campo diverso
    const c2 = { ...baseline, ingredientCategories: { ...baseline.ingredientCategories, farina: ["base", "cereali"] } };
    const diff2 = diffSystemFields(baseline, c2);
    const { conflicts: conflicts2 } = await saveEntriesOnlineLocal(db, bookId, baseline, c2, diff2.mapChanges, diff2.changedArrayFields);
    expect(conflicts2.mapEntries).toEqual({});

    const snap = await getDoc(systemRef(db, bookId));
    const data = decodeSystem(snap.data());
    expect(data.nutritionMap.pomodoro).toEqual({ foodId: "f2" });
    expect(data.ingredientCategories.farina).toEqual(["base", "cereali"]);
    // Voci non toccate da nessuno dei due restano quelle originali
    expect(data.nutritionMap.zucchero).toEqual(baseline.nutritionMap.zucchero);
  });
});

describe("conflitti multi-utente — stessa voce, concorrente", () => {
  it("il secondo client viene rifiutato, nessun dato corrotto", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = baseSystem();
    await assertSucceeds(setDoc(systemRef(db, bookId), encodeSystem(baseline)));

    // Entrambi i client leggono la stessa baseline per nutritionMap.zucchero
    const c1 = { ...baseline, nutritionMap: { ...baseline.nutritionMap, zucchero: { foodId: "f-client1" } } };
    const c2 = { ...baseline, nutritionMap: { ...baseline.nutritionMap, zucchero: { foodId: "f-client2" } } };

    const diff1 = diffSystemFields(baseline, c1);
    const { conflicts: conflicts1 } = await saveEntriesOnlineLocal(db, bookId, baseline, c1, diff1.mapChanges, diff1.changedArrayFields);
    expect(conflicts1.mapEntries).toEqual({}); // il primo passa senza conflitti

    // Il secondo usa ANCORA la baseline vecchia (non sa che client1 ha già scritto)
    const diff2 = diffSystemFields(baseline, c2);
    const { conflicts: conflicts2 } = await saveEntriesOnlineLocal(db, bookId, baseline, c2, diff2.mapChanges, diff2.changedArrayFields);

    // La scrittura di client2 su zucchero viene rifiutata
    expect(conflicts2.mapEntries.nutritionMap.zucchero).toEqual({ foodId: "f-client1" });

    // Il server mantiene il valore di client1, mai un mix/corruzione
    const snap = await getDoc(systemRef(db, bookId));
    const data = decodeSystem(snap.data());
    expect(data.nutritionMap.zucchero).toEqual({ foodId: "f-client1" });
  });
});

describe("conflitti multi-utente — azione multi-campo con conflitto non correlato altrove", () => {
  it("deleteIngredients (7 campi insieme) passa intera anche se qualcun altro tocca una voce diversa nel frattempo", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = baseSystem();
    await assertSucceeds(setDoc(systemRef(db, bookId), encodeSystem(baseline)));

    // Un altro client, nel frattempo, aggiunge una voce NON correlata a
    // nutritionMap (chiave diversa da quella che l'eliminazione tocca)
    const other = { ...baseline, nutritionMap: { ...baseline.nutritionMap, pomodoro: { foodId: "f2" } } };
    const otherDiff = diffSystemFields(baseline, other);
    await saveEntriesOnlineLocal(db, bookId, baseline, other, otherDiff.mapChanges, otherDiff.changedArrayFields);

    // Client A elimina "zucchero" — stessa trasformazione di applyDeleteIngredients,
    // partendo dalla SUA baseline (non sa dell'aggiunta di "other")
    const after = applyDeleteIngredients(baseline, ["zucchero"]);
    const diffA = diffSystemFields(baseline, after);
    const { conflicts } = await saveEntriesOnlineLocal(db, bookId, baseline, after, diffA.mapChanges, diffA.changedArrayFields);

    // Nessun conflitto: le voci toccate da A (zucchero) e da "other" (pomodoro) non si sovrappongono
    expect(conflicts.mapEntries).toEqual({});
    expect(conflicts.arrayFields).toEqual([]);

    const snap = await getDoc(systemRef(db, bookId));
    const data = decodeSystem(snap.data());
    // L'eliminazione è passata intera sui 5 campi-mappa...
    expect(data.ingredientDict).toEqual({ farina: "Farina" });
    expect(data.ingredientCategories).toEqual({ farina: ["base"] });
    expect(data.sourceByIngredient).toEqual({});
    expect(data.equivalences).toEqual({});
    expect(data.aggregates[0].members).toEqual(["farina"]);
    expect(data.ignoredSimilarities).toEqual([]);
    // ...senza perdere l'aggiunta non correlata dell'altro client
    expect(data.nutritionMap).toEqual({ pomodoro: { foodId: "f2" } });
  });
});

describe("conflitti multi-utente — scrittura offline (mirata, nessun rilevamento conflitti)", () => {
  it("scrive solo le voci toccate, senza cancellare campi/voci intoccati", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = baseSystem();
    await assertSucceeds(setDoc(systemRef(db, bookId), encodeSystem(baseline)));

    // Simula un client offline che ha modificato SOLO una voce di customUnits
    // (campo vuoto nella baseline)
    const current = { ...baseline, customUnits: { cucchiaino: { grams: 5 } } };
    const diff = diffSystemFields(baseline, current);
    await saveEntriesOfflineLocal(db, bookId, current, diff.mapChanges, diff.changedArrayFields);

    const snap = await getDoc(systemRef(db, bookId));
    const data = decodeSystem(snap.data());
    // La voce nuova c'è...
    expect(data.customUnits).toEqual({ cucchiaino: { grams: 5 } });
    // ...e tutto il resto del documento (11 altri campi) resta intatto,
    // stessa garanzia di merge:true ma qui a grana ancora più fine.
    expect(data.ingredientDict).toEqual(baseline.ingredientDict);
    expect(data.nutritionMap).toEqual(baseline.nutritionMap);
    expect(data.aggregates).toEqual(baseline.aggregates);
    expect(data.ignoredSimilarities).toEqual(baseline.ignoredSimilarities);
  });
});
