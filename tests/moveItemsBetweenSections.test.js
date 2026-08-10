import { describe, it, expect } from "vitest";
import { moveItemsBetweenSections, normalizeSteps } from "../src/utils/helpers.js";

describe("moveItemsBetweenSections", () => {
  it("sciolti → nuova sezione (singolo item)", () => {
    const sections = [{ section: "", items: ["Uno", "Due", "Tre"] }];
    const out = moveItemsBetweenSections(sections, [{ sectionIndex: 0, itemIndex: 1 }], { type: "new", name: "Impasto" });
    expect(out).toEqual([
      { section: "", items: ["Uno", "Tre"] },
      { section: "Impasto", items: ["Due"] },
    ]);
  });

  it("sezione → sciolti (verso una sezione section:'' già esistente)", () => {
    const sections = [
      { section: "", items: ["Sciolto1"] },
      { section: "Farcitura", items: ["A", "B"] },
    ];
    const out = moveItemsBetweenSections(sections, [{ sectionIndex: 1, itemIndex: 0 }], { type: "existing", sectionIndex: 0 });
    expect(out).toEqual([
      { section: "", items: ["Sciolto1", "A"] },
      { section: "Farcitura", items: ["B"] },
    ]);
  });

  it("sezione A → sezione B (cross-section)", () => {
    const sections = [
      { section: "A", items: ["a1", "a2"] },
      { section: "B", items: ["b1"] },
    ];
    const out = moveItemsBetweenSections(sections, [{ sectionIndex: 0, itemIndex: 0 }], { type: "existing", sectionIndex: 1 });
    expect(out).toEqual([
      { section: "A", items: ["a2"] },
      { section: "B", items: ["b1", "a1"] },
    ]);
  });

  it("multi-select da sezioni sorgente diverse, passato in ordine di selezione 'sbagliato' → l'output rispetta l'ordine visuale", () => {
    const sections = [
      { section: "", items: ["s0-0", "s0-1"] },
      { section: "Nome", items: ["s1-0", "s1-1"] },
    ];
    // Selezione in ordine "sbagliato": prima s1-1, poi s0-0, poi s1-0
    const positions = [
      { sectionIndex: 1, itemIndex: 1 },
      { sectionIndex: 0, itemIndex: 0 },
      { sectionIndex: 1, itemIndex: 0 },
    ];
    const out = moveItemsBetweenSections(sections, positions, { type: "new", name: "Raccolta" });
    // Ordine visuale atteso: s0-0 (sez.0,idx0), s1-0 (sez.1,idx0), s1-1 (sez.1,idx1)
    expect(out[out.length - 1]).toEqual({ section: "Raccolta", items: ["s0-0", "s1-0", "s1-1"] });
  });

  it("multi-select con più item dalla stessa sezione sorgente (caso reale: primi 4 di 8 passaggi sciolti)", () => {
    const items = Array.from({ length: 8 }, (_, i) => `Passo ${i + 1}`);
    const sections = [{ section: "", items }];
    const positions = [
      { sectionIndex: 0, itemIndex: 3 },
      { sectionIndex: 0, itemIndex: 0 },
      { sectionIndex: 0, itemIndex: 1 },
      { sectionIndex: 0, itemIndex: 2 },
    ];
    const out = moveItemsBetweenSections(sections, positions, { type: "new", name: "Impasto" });
    expect(out).toEqual([
      { section: "", items: ["Passo 5", "Passo 6", "Passo 7", "Passo 8"] },
      { section: "Impasto", items: ["Passo 1", "Passo 2", "Passo 3", "Passo 4"] },
    ]);
  });

  it("destinazione 'new' con nome contenente solo spazi viene 'trimmato'", () => {
    const sections = [{ section: "", items: ["x"] }];
    const out = moveItemsBetweenSections(sections, [{ sectionIndex: 0, itemIndex: 0 }], { type: "new", name: "  Farcitura  " });
    expect(out[1].section).toBe("Farcitura");
  });

  it("un item-oggetto con photos/duration sopravvive intatto allo spostamento", () => {
    const step = { text: "Cuocere", photos: ["data:img"], duration: 25 };
    const sections = [{ section: "", items: [step] }];
    const out = moveItemsBetweenSections(sections, [{ sectionIndex: 0, itemIndex: 0 }], { type: "new", name: "Cottura" });
    expect(out[1].items[0]).toBe(step); // stesso oggetto, nessuna copia parziale
  });

  it("la sezione sorgente svuotata resta nell'array come sezione vuota", () => {
    const sections = [
      { section: "Sola", items: ["unico"] },
      { section: "Altra", items: ["x"] },
    ];
    const out = moveItemsBetweenSections(sections, [{ sectionIndex: 0, itemIndex: 0 }], { type: "existing", sectionIndex: 1 });
    expect(out[0]).toEqual({ section: "Sola", items: [] });
  });

  it("multi-select tutto dalla stessa sezione, verso quella stessa sezione: riordina preservando l'ordine relativo", () => {
    const sections = [{ section: "", items: ["a", "b", "c", "d"] }];
    // Sposta "a" e "c" in fondo alla stessa sezione
    const out = moveItemsBetweenSections(sections, [
      { sectionIndex: 0, itemIndex: 2 },
      { sectionIndex: 0, itemIndex: 0 },
    ], { type: "existing", sectionIndex: 0 });
    expect(out).toEqual([{ section: "", items: ["b", "d", "a", "c"] }]);
  });
});

describe("normalizeSteps", () => {
  it("piatto: scarta step a testo vuoto (stringhe)", () => {
    expect(normalizeSteps(["Uno", "", "  ", "Due"])).toEqual(["Uno", "Due"]);
  });

  it("piatto: uno step-oggetto con foto/durata ma testo vuoto NON viene scartato", () => {
    const withPhoto = { text: "", photos: ["data:img"] };
    expect(normalizeSteps([withPhoto])).toEqual([{ text: "", photos: ["data:img"] }]);
  });

  it("sezionato: scarta step a testo vuoto dentro ciascuna sezione", () => {
    const out = normalizeSteps([{ section: "Impasto", items: ["Uno", ""] }]);
    expect(out).toEqual([{ section: "Impasto", items: ["Uno"] }]);
  });

  it("sezionato: scarta sezioni rimaste vuote SENZA nome", () => {
    const out = normalizeSteps([
      { section: "", items: [""] },
      { section: "Impasto", items: ["Uno"] },
    ]);
    expect(out).toEqual([{ section: "Impasto", items: ["Uno"] }]);
  });

  it("sezionato: mantiene sezioni rimaste vuote CON nome", () => {
    const out = normalizeSteps([{ section: "Farcitura", items: [""] }]);
    expect(out).toEqual([{ section: "Farcitura", items: [] }]);
  });

  it("converte uno step-oggetto senza foto/durata a stringa semplice (stripPhotolessStep)", () => {
    const out = normalizeSteps([{ text: "Mescolare", photos: [] }]);
    expect(out).toEqual(["Mescolare"]);
  });
});
