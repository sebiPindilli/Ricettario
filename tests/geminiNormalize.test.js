import { describe, it, expect } from "vitest";
import { normalizeRecipeJson } from "../lib/gemini.js";

describe("normalizeRecipeJson — caso piatto (regressione)", () => {
  it("ingredients e steps piatti restano piatti", () => {
    const out = normalizeRecipeJson({
      title: "Torta",
      ingredients: [{ name: "Farina", qty: "200", unit: "g" }],
      steps: ["Mescolare", "Cuocere"],
    });
    expect(out.ingredients).toEqual([{ name: "Farina", qty: 200, unit: "g" }]);
    expect(out.steps).toEqual(["Mescolare", "Cuocere"]);
  });

  it("steps come stringa singola viene diviso per riga (comportamento preesistente)", () => {
    const out = normalizeRecipeJson({ steps: "Uno\nDue\n\nTre" });
    expect(out.steps).toEqual(["Uno", "Due", "Tre"]);
  });

  it("ingredients/steps assenti restano array vuoti", () => {
    const out = normalizeRecipeJson({});
    expect(out.ingredients).toEqual([]);
    expect(out.steps).toEqual([]);
  });
});

describe("normalizeRecipeJson — caso sezionato", () => {
  it("ingredients sezionati vengono preservati come {section, items}", () => {
    const out = normalizeRecipeJson({
      ingredients: [
        { section: "Per l'impasto", items: [{ name: "Farina", qty: "200", unit: "g" }] },
        { section: "Per la farcitura", items: [{ name: "Marmellata", qty: "100", unit: "g" }] },
      ],
    });
    expect(out.ingredients).toEqual([
      { section: "Per l'impasto", items: [{ name: "Farina", qty: 200, unit: "g" }] },
      { section: "Per la farcitura", items: [{ name: "Marmellata", qty: 100, unit: "g" }] },
    ]);
  });

  it("steps sezionati vengono preservati come {section, items}", () => {
    const out = normalizeRecipeJson({
      steps: [
        { section: "Impasto", items: ["Mescolare", "Impastare"] },
        { section: "Cottura", items: ["Infornare"] },
      ],
    });
    expect(out.steps).toEqual([
      { section: "Impasto", items: ["Mescolare", "Impastare"] },
      { section: "Cottura", items: ["Infornare"] },
    ]);
  });

  it("un gruppo sezionato senza nome (section:'' esplicito) viene preservato", () => {
    const out = normalizeRecipeJson({
      steps: [{ section: "", items: ["Uno"] }, { section: "Farcitura", items: ["Due"] }],
    });
    expect(out.steps).toEqual([
      { section: "", items: ["Uno"] },
      { section: "Farcitura", items: ["Due"] },
    ]);
  });

  it("una sezione con items vuoti sopravvive a questo livello (il filtro finale è del client)", () => {
    const out = normalizeRecipeJson({
      ingredients: [{ section: "Vuota", items: [] }],
    });
    expect(out.ingredients).toEqual([{ section: "Vuota", items: [] }]);
  });

  it("caso misto: ingredients sezionati e steps piatti, indipendenti l'uno dall'altro", () => {
    const out = normalizeRecipeJson({
      ingredients: [{ section: "Impasto", items: [{ name: "Farina" }] }],
      steps: ["Mescolare"],
    });
    expect(out.ingredients).toEqual([{ section: "Impasto", items: [{ name: "Farina", qty: "", unit: "" }] }]);
    expect(out.steps).toEqual(["Mescolare"]);
  });
});
