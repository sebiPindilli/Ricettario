import { describe, it, expect } from "vitest";
import { buildIngredientDict } from "../src/utils/helpers.js";

const recipe = (ingredients) => ({ ingredients });

describe("buildIngredientDict — riferimento stabile", () => {
  it("nessun ingrediente nuovo → ritorna lo stesso riferimento existing", () => {
    const recipes = [recipe([{ name: "zucchero", qty: 100, unit: "g" }])];
    const existing = { zucchero: "zucchero" };
    const result = buildIngredientDict(recipes, existing);
    expect(result).toBe(existing);
  });

  it("ingrediente nuovo → ritorna un nuovo oggetto con l'aggiunta", () => {
    const recipes = [recipe([{ name: "farina", qty: 200, unit: "g" }])];
    const existing = { zucchero: "zucchero" };
    const result = buildIngredientDict(recipes, existing);
    expect(result).not.toBe(existing);
    expect(Object.values(result)).toContain("farina");
    expect(Object.values(result)).toContain("zucchero");
  });

  it("dizionario vuoto e nessuna ricetta → ritorna existing invariato", () => {
    const existing = {};
    const result = buildIngredientDict([], existing);
    expect(result).toBe(existing);
  });
});
