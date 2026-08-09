// Verifica il salvataggio mirato del documento "system" (vedi flushSystemNow
// in src/ricettario-v23.jsx) contro l'emulator Firestore locale — non il
// progetto di produzione. Si esegue con `npm run test:rules`.
//
// Il documento system è un unico documento per 12 proprietà: la garanzia
// da verificare non è "quale campo è cambiato" (come per le ricette, vedi
// recipeFlush.test.js) ma che un'azione che tocca PIÙ campi insieme
// (es. deleteIngredients, che pulisce dizionario/categorie/priorità fonte/
// equivalenze/nutrizione/aggregati/similarità ignorate in un colpo solo)
// produca UNA sola scrittura coerente con tutti i cambiamenti — senza
// bisogno di codice speciale, perché flushSystemNow scrive sempre
// l'istantanea COMPLETA delle 12 proprietà, mai un sottoinsieme.
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { initializeTestEnvironment, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

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
