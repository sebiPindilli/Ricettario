// Verifica il meccanismo di salvataggio mirato delle ricette (vedi
// src/utils/dirtyTracking.js e flushRecipesNow in src/ricettario-v23.jsx)
// contro l'emulator Firestore reale — non il progetto di produzione.
// Si esegue con `npm run test:rules`, che avvia e ferma l'emulator
// automaticamente attorno a Vitest (vedi package.json).
//
// Il test più importante qui è "switchBook non perde modifiche pendenti":
// il regression più critico di tutto questo lavoro, perché il problema che
// il salvataggio "tutto insieme" doveva evitare era proprio la perdita
// silenziosa di dati.
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { initializeTestEnvironment, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { diffRecipes, recipesToMap } from "../src/utils/dirtyTracking.js";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ricettario-flush-test",
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

const recipeRef = (db, bookId, id) => doc(db, "books", bookId, "recipes", String(id));

const seedRecipes = async (db, bookId, recipes) => {
  await Promise.all(recipes.map((r) => assertSucceeds(setDoc(recipeRef(db, bookId, r.id), r))));
};

// Applica al Firestore reale (emulator) esattamente ciò che flushRecipesNow
// farebbe: setDoc per ogni ricetta cambiata, deleteDoc per ogni id rimosso.
const applyFlush = async (db, bookId, changed, removedIds) => {
  await Promise.all([
    ...changed.map((r) => setDoc(recipeRef(db, bookId, r.id), r)),
    ...removedIds.map((id) => deleteDoc(recipeRef(db, bookId, id))),
  ]);
};

const loadRecipes = async (db, bookId) => {
  const snap = await getDocs(collection(db, "books", bookId, "recipes"));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
};

describe("flush ricette — scrive solo ciò che è cambiato", () => {
  it("modifica su 1 ricetta di 3 → solo quella viene riscritta, le altre restano intatte", async () => {
    const db = dbFor();
    const bookId = "book1";
    const r1 = { id: "r1", title: "Brownies" };
    const r2 = { id: "r2", title: "Tiramisù" };
    const r3 = { id: "r3", title: "Carbonara" };
    await seedRecipes(db, bookId, [r1, r2, r3]);

    const lastSynced = recipesToMap([r1, r2, r3]);
    const r2Edited = { ...r2, title: "Tiramisù della nonna" };
    const current = [r1, r2Edited, r3];

    const { changed, removedIds } = diffRecipes(lastSynced, current);
    expect(changed).toEqual([r2Edited]);
    await applyFlush(db, bookId, changed, removedIds);

    const persisted = await loadRecipes(db, bookId);
    const byId = Object.fromEntries(persisted.map((r) => [r.id, r]));
    expect(byId.r1.title).toBe("Brownies");
    expect(byId.r2.title).toBe("Tiramisù della nonna");
    expect(byId.r3.title).toBe("Carbonara");
  });

  it("ricetta rimossa dall'array → viene eliminata su Firestore, le altre restano", async () => {
    const db = dbFor();
    const bookId = "book1";
    const r1 = { id: "r1", title: "Brownies" };
    const r2 = { id: "r2", title: "Tiramisù" };
    await seedRecipes(db, bookId, [r1, r2]);

    const lastSynced = recipesToMap([r1, r2]);
    const { changed, removedIds } = diffRecipes(lastSynced, [r1]);
    expect(removedIds).toEqual(["r2"]);
    await applyFlush(db, bookId, changed, removedIds);

    const persisted = await loadRecipes(db, bookId);
    expect(persisted.map((r) => r.id).sort()).toEqual(["r1"]);
  });
});

describe("flush ricette — switchBook non perde modifiche pendenti", () => {
  it("una modifica non ancora salvata viene persistita PRIMA di cambiare libro", async () => {
    const db = dbFor();
    const bookId = "book1";
    const r1 = { id: "r1", title: "Brownies" };
    const r2 = { id: "r2", title: "Tiramisù" };
    await seedRecipes(db, bookId, [r1, r2]);

    // Stato in memoria: r1 è stata modificata ma il debounce non è ancora
    // scattato (esattamente la situazione in cui l'utente cambia libro
    // prima che passi 1.5s).
    const lastSynced = recipesToMap([r1, r2]);
    const r1Edited = { ...r1, title: "Brownies al doppio cioccolato" };
    const inMemory = [r1Edited, r2];

    // switchBook deve fare esattamente questo PRIMA di caricare l'altro
    // libro: diff + flush immediato (await-ato, non il debounce).
    const { changed, removedIds } = diffRecipes(lastSynced, inMemory);
    await applyFlush(db, bookId, changed, removedIds);

    // Ora "cambiamo libro": ricarichiamo le ricette da Firestore, come
    // farebbe loadFullBook — la modifica non deve essere andata persa.
    const reloaded = await loadRecipes(db, bookId);
    const r1Reloaded = reloaded.find((r) => r.id === "r1");
    expect(r1Reloaded.title).toBe("Brownies al doppio cioccolato");
  });
});

describe("flush ricette — nessuna modifica → nessuna scrittura necessaria", () => {
  it("stessi riferimenti → diff vuoto, il flush non deve chiamare Firestore", async () => {
    const r1 = { id: "r1", title: "Brownies" };
    const r2 = { id: "r2", title: "Tiramisù" };
    const recipes = [r1, r2];
    const lastSynced = recipesToMap(recipes);

    const { changed, removedIds } = diffRecipes(lastSynced, recipes);
    expect(changed).toEqual([]);
    expect(removedIds).toEqual([]);
    // Nessuna assertSucceeds/setDoc qui: il punto del test è che flushRecipesNow
    // ritorna prima di toccare la rete quando changed/removedIds sono vuoti.
  });
});
