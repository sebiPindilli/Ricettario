import { describe, it, expect } from "vitest";
import {
  diffRecipes, recipesToMap, diffSystemFields, deepEqual,
  diffShoppingEntries, shoppingEntriesToMap,
} from "../src/utils/dirtyTracking.js";

const recipe = (id, extra = {}) => ({ id, title: `Ricetta ${id}`, ingredients: [], steps: [], ...extra });

describe("diffRecipes — nessuna modifica", () => {
  it("stessi riferimenti → diff vuoto", () => {
    const recipes = [recipe(1), recipe(2), recipe(3)];
    const lastSynced = recipesToMap(recipes);
    const { changed, removedIds } = diffRecipes(lastSynced, recipes);
    expect(changed).toEqual([]);
    expect(removedIds).toEqual([]);
  });
});

describe("diffRecipes — modifica singola", () => {
  it("titolo cambiato su 1 di N → solo quella ricetta in changed", () => {
    const r1 = recipe(1), r2 = recipe(2), r3 = recipe(3);
    const lastSynced = recipesToMap([r1, r2, r3]);
    const r2Updated = { ...r2, title: "Nuovo titolo" };
    const { changed, removedIds } = diffRecipes(lastSynced, [r1, r2Updated, r3]);
    expect(changed).toEqual([r2Updated]);
    expect(removedIds).toEqual([]);
  });
});

describe("diffRecipes — creazione", () => {
  it("ricetta nuova → compare in changed, nessun removedIds", () => {
    const r1 = recipe(1);
    const lastSynced = recipesToMap([r1]);
    const r2 = recipe(2);
    const { changed, removedIds } = diffRecipes(lastSynced, [r1, r2]);
    expect(changed).toEqual([r2]);
    expect(removedIds).toEqual([]);
  });
});

describe("diffRecipes — eliminazione", () => {
  it("ricetta rimossa → compare in removedIds, changed vuoto", () => {
    const r1 = recipe(1), r2 = recipe(2);
    const lastSynced = recipesToMap([r1, r2]);
    const { changed, removedIds } = diffRecipes(lastSynced, [r1]);
    expect(changed).toEqual([]);
    expect(removedIds).toEqual([2]);
  });

  it("creazione ed eliminazione insieme", () => {
    const r1 = recipe(1), r2 = recipe(2);
    const lastSynced = recipesToMap([r1, r2]);
    const r3 = recipe(3);
    const { changed, removedIds } = diffRecipes(lastSynced, [r1, r3]);
    expect(changed).toEqual([r3]);
    expect(removedIds).toEqual([2]);
  });
});

describe("diffRecipes — scenario renameIngredient (dopo la correzione)", () => {
  it("solo le ricette che contengono l'ingrediente rinominato risultano dirty", () => {
    const withIng = recipe(1, { ingredients: [{ name: "zucchero", qty: 100, unit: "g" }] });
    const withoutIng = recipe(2, { ingredients: [{ name: "farina", qty: 200, unit: "g" }] });
    const lastSynced = recipesToMap([withIng, withoutIng]);

    // Simula la stessa disciplina di renameIngredient corretto: solo la
    // ricetta con l'ingrediente riceve un nuovo riferimento.
    const withIngRenamed = { ...withIng, ingredients: [{ name: "zucchero di canna", qty: 100, unit: "g" }] };
    const next = [withIngRenamed, withoutIng];

    const { changed, removedIds } = diffRecipes(lastSynced, next);
    expect(changed).toEqual([withIngRenamed]);
    expect(removedIds).toEqual([]);
  });
});

describe("diffRecipes — scenario deleteSection", () => {
  it("solo le ricette della sezione eliminata risultano dirty", () => {
    const inSection = recipe(1, { macroSection: "dolci" });
    const otherSection = recipe(2, { macroSection: "salati" });
    const lastSynced = recipesToMap([inSection, otherSection]);

    const reassigned = { ...inSection, macroSection: "altro" };
    const next = [reassigned, otherSection];

    const { changed, removedIds } = diffRecipes(lastSynced, next);
    expect(changed).toEqual([reassigned]);
    expect(removedIds).toEqual([]);
  });
});

// ── diffSystemFields — vedi Fase B del piano conflitti multi-utente (12
// proprietà del documento system, granularità per voce sui campi-mappa,
// per intero campo sui campi-lista, vedi il commento in dirtyTracking.js).
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

describe("diffSystemFields — nessuna modifica", () => {
  it("stessi riferimenti → nessun campo-mappa e nessun campo-lista", () => {
    const system = baseSystem();
    const { mapChanges, changedArrayFields } = diffSystemFields(system, system);
    expect(mapChanges).toEqual({});
    expect(changedArrayFields).toEqual([]);
  });
});

describe("diffSystemFields — campo-mappa, voce modificata", () => {
  it("solo la chiave cambiata compare, in un solo campo", () => {
    const before = baseSystem();
    const after = { ...before, nutritionMap: { ...before.nutritionMap, zucchero: { foodId: "f2" } } };
    const { mapChanges, changedArrayFields } = diffSystemFields(before, after);
    expect(mapChanges).toEqual({ nutritionMap: { changed: { zucchero: { foodId: "f2" } }, removedKeys: [] } });
    expect(changedArrayFields).toEqual([]);
  });
});

describe("diffSystemFields — campo-mappa, voce aggiunta", () => {
  it("la nuova chiave compare in changed", () => {
    const before = baseSystem();
    const after = { ...before, ingredientDict: { ...before.ingredientDict, pomodoro: "Pomodoro" } };
    const { mapChanges } = diffSystemFields(before, after);
    expect(mapChanges.ingredientDict).toEqual({ changed: { pomodoro: "Pomodoro" }, removedKeys: [] });
  });
});

describe("diffSystemFields — campo-mappa, voce rimossa", () => {
  it("la chiave sparita compare in removedKeys, changed vuoto", () => {
    const before = baseSystem();
    const rest = Object.fromEntries(Object.entries(before.ingredientDict).filter(([k]) => k !== "farina"));
    const after = { ...before, ingredientDict: rest };
    const { mapChanges } = diffSystemFields(before, after);
    expect(mapChanges.ingredientDict).toEqual({ changed: {}, removedKeys: ["farina"] });
  });
});

describe("diffSystemFields — campo-lista", () => {
  it("nuovo riferimento → il campo compare in changedArrayFields", () => {
    const before = baseSystem();
    const after = { ...before, categoryList: [...before.categoryList, { id: "dolci2", label: "Altri dolci" }] };
    const { mapChanges, changedArrayFields } = diffSystemFields(before, after);
    expect(changedArrayFields).toEqual(["categoryList"]);
    expect(mapChanges).toEqual({});
  });

  it("stesso riferimento, anche se il contenuto sarebbe uguale se ricreato → nessun cambiamento", () => {
    const before = baseSystem();
    const after = { ...before }; // categoryList non toccato, stesso riferimento
    const { changedArrayFields } = diffSystemFields(before, after);
    expect(changedArrayFields).toEqual([]);
  });
});

describe("diffSystemFields — scenario deleteIngredients (azione multi-campo atomica)", () => {
  it("tutti i campi toccati dall'eliminazione di un ingrediente compaiono in un solo diff", () => {
    const before = baseSystem();
    const idSet = new Set(["zucchero"]);
    const stripKeys = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => !idSet.has(k)));
    const after = {
      ...before,
      ingredientDict: stripKeys(before.ingredientDict),
      ingredientCategories: stripKeys(before.ingredientCategories),
      sourceByIngredient: stripKeys(before.sourceByIngredient),
      equivalences: stripKeys(before.equivalences),
      nutritionMap: stripKeys(before.nutritionMap),
      aggregates: before.aggregates.map((a) => ({ ...a, members: a.members.filter((m) => !idSet.has(m)) })),
      ignoredSimilarities: before.ignoredSimilarities.filter(([a, b]) => !idSet.has(a) && !idSet.has(b)),
    };

    const { mapChanges, changedArrayFields } = diffSystemFields(before, after);

    // 5 campi-mappa toccati, ognuno con "zucchero" rimosso, nient'altro cambiato
    expect(Object.keys(mapChanges).sort()).toEqual(
      ["equivalences", "ingredientCategories", "ingredientDict", "nutritionMap", "sourceByIngredient"].sort()
    );
    Object.values(mapChanges).forEach((c) => {
      expect(c.removedKeys).toEqual(["zucchero"]);
      expect(c.changed).toEqual({});
    });
    // 2 campi-lista toccati (nuovo riferimento per entrambi)
    expect(changedArrayFields.sort()).toEqual(["aggregates", "ignoredSimilarities"].sort());
    // I campi non toccati dall'azione non compaiono affatto
    expect(mapChanges.customUnits).toBeUndefined();
    expect(changedArrayFields).not.toContain("categoryList");
    expect(changedArrayFields).not.toContain("sectionList");
    expect(changedArrayFields).not.toContain("extraTagGroups");
    expect(changedArrayFields).not.toContain("customFoods");
  });
});

// diffShoppingEntries/shoppingEntriesToMap sono alias diretti di
// diffRecipes/recipesToMap (Fase C, lista spesa) — questi test esistono per
// documentare il riuso con dati a forma di voce-lista-spesa, non per
// ritestare una logica già coperta sopra.
const entry = (id, extra = {}) => ({ id, recipeId: `r-${id}`, items: [], selectedNames: [], ...extra });

describe("diffShoppingEntries — riuso di diffRecipes per le voci della lista spesa", () => {
  it("nessuna modifica → diff vuoto", () => {
    const entries = [entry(1), entry(2)];
    const lastSynced = shoppingEntriesToMap(entries);
    const { changed, removedIds } = diffShoppingEntries(lastSynced, entries);
    expect(changed).toEqual([]);
    expect(removedIds).toEqual([]);
  });

  it("una voce modificata (es. spuntato un articolo) → solo quella in changed", () => {
    const e1 = entry(1), e2 = entry(2);
    const lastSynced = shoppingEntriesToMap([e1, e2]);
    const e1Updated = { ...e1, selectedNames: ["farina"] };
    const { changed, removedIds } = diffShoppingEntries(lastSynced, [e1Updated, e2]);
    expect(changed).toEqual([e1Updated]);
    expect(removedIds).toEqual([]);
  });

  it("una voce rimossa (es. eliminata dalla lista) → compare in removedIds", () => {
    const e1 = entry(1), e2 = entry(2);
    const lastSynced = shoppingEntriesToMap([e1, e2]);
    const { changed, removedIds } = diffShoppingEntries(lastSynced, [e1]);
    expect(changed).toEqual([]);
    expect(removedIds).toEqual([2]);
  });
});

describe("deepEqual", () => {
  it("primitivi uguali → true, diversi → false", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual("a", "b")).toBe(false);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(undefined, undefined)).toBe(true);
  });

  it("oggetti con stesse chiavi/valori ma riferimenti diversi → true", () => {
    expect(deepEqual({ foodId: "f1" }, { foodId: "f1" })).toBe(true);
    expect(deepEqual({ factors: { cucchiaio: 10 } }, { factors: { cucchiaio: 10 } })).toBe(true);
  });

  it("oggetti con un valore diverso → false", () => {
    expect(deepEqual({ foodId: "f1" }, { foodId: "f2" })).toBe(false);
  });

  it("oggetti con chiavi diverse (stessa lunghezza) → false", () => {
    expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it("array uguali per valore → true, ordine diverso → false", () => {
    expect(deepEqual(["base", "dolci"], ["base", "dolci"])).toBe(true);
    expect(deepEqual(["base", "dolci"], ["dolci", "base"])).toBe(false);
  });

  it("array vs oggetto → false anche a contenuto apparentemente simile", () => {
    expect(deepEqual([], {})).toBe(false);
  });

  it("nidificato (equivalences-like) → confronta in profondità", () => {
    const a = { factors: { "": 60, cucchiaio: 10 } };
    const b = { factors: { "": 60, cucchiaio: 10 } };
    const c = { factors: { "": 60, cucchiaio: 12 } };
    expect(deepEqual(a, b)).toBe(true);
    expect(deepEqual(a, c)).toBe(false);
  });
});
