import { describe, it, expect } from "vitest";
import { parseStepDuration, durationOf, stripPhotolessStep } from "../src/utils/helpers.js";

describe("parseStepDuration — frasi richieste", () => {
  it("cuocere 25 min → 25", () => {
    expect(parseStepDuration("Cuocere in forno 25 min a 180°")).toBe(25);
  });
  it("20-25 minuti → 20 (il valore più piccolo)", () => {
    expect(parseStepDuration("Lasciar riposare 20-25 minuti")).toBe(20);
  });
  it("un'ora e mezza → 90", () => {
    expect(parseStepDuration("Cuocere per un'ora e mezza")).toBe(90);
  });
  it("1h 30 → 90", () => {
    expect(parseStepDuration("Tempo di cottura: 1h 30")).toBe(90);
  });
  it("mezz'ora → 30", () => {
    expect(parseStepDuration("Far riposare mezz'ora")).toBe(30);
  });
  it("per 2 ore → 120", () => {
    expect(parseStepDuration("Marinare per 2 ore in frigo")).toBe(120);
  });
});

describe("parseStepDuration — varianti e casi limite", () => {
  it("nessun numero → null", () => {
    expect(parseStepDuration("Mescolare bene gli ingredienti")).toBeNull();
  });
  it("testo vuoto/assente → null", () => {
    expect(parseStepDuration("")).toBeNull();
    expect(parseStepDuration(null)).toBeNull();
    expect(parseStepDuration(undefined)).toBeNull();
  });
  it("decimali con la virgola", () => {
    expect(parseStepDuration("Cuocere 1,5 ore")).toBe(90);
  });
  it("un'ora e un quarto / tre quarti", () => {
    expect(parseStepDuration("Cuocere un'ora e un quarto")).toBe(75);
    expect(parseStepDuration("Cuocere un'ora e tre quarti")).toBe(105);
  });
  it("1h senza minuti → solo l'ora", () => {
    expect(parseStepDuration("Lievitazione 1h in luogo tiepido")).toBe(60);
  });
  it("singolare/plurale minuto-minuti indifferenti", () => {
    expect(parseStepDuration("Attendere 1 minuto")).toBe(1);
    expect(parseStepDuration("Attendere 10 minuti")).toBe(10);
  });
  it("un numero senza unità riconosciuta non è una durata (es. quantità)", () => {
    expect(parseStepDuration("Aggiungere 300 g di farina")).toBeNull();
  });
});

describe("durationOf", () => {
  it("stringa semplice → sempre null", () => {
    expect(durationOf("Mescolare per bene")).toBeNull();
  });
  it("oggetto senza duration → null", () => {
    expect(durationOf({ text: "Mescolare", photos: [] })).toBeNull();
  });
  it("oggetto con duration → il valore", () => {
    expect(durationOf({ text: "Cuocere", duration: 25 })).toBe(25);
  });
});

describe("stripPhotolessStep — preserva la durata come già faceva con le foto", () => {
  it("nessuna foto né durata → torna stringa semplice (comportamento invariato)", () => {
    expect(stripPhotolessStep({ text: "Mescolare", photos: [] })).toBe("Mescolare");
  });
  it("stringa in ingresso → resta stringa", () => {
    expect(stripPhotolessStep("Mescolare")).toBe("Mescolare");
  });
  it("solo durata, nessuna foto → resta oggetto con duration, senza chiave photos", () => {
    const out = stripPhotolessStep({ text: "Cuocere 25 min", duration: 25, photos: [] });
    expect(out).toEqual({ text: "Cuocere 25 min", duration: 25 });
  });
  it("solo foto, nessuna durata → comportamento invariato (oggetto con photos, senza duration)", () => {
    const out = stripPhotolessStep({ text: "Impiattare", photos: ["data:image/x"] });
    expect(out).toEqual({ text: "Impiattare", photos: ["data:image/x"] });
  });
  it("sia foto sia durata → entrambe preservate", () => {
    const out = stripPhotolessStep({ text: "Cuocere", duration: 25, photos: ["data:image/x"] });
    expect(out).toEqual({ text: "Cuocere", photos: ["data:image/x"], duration: 25 });
  });
});
