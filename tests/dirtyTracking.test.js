import { describe, it, expect } from "vitest";
import { diffRecipes, recipesToMap } from "../src/utils/dirtyTracking.js";

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
