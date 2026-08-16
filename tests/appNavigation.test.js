import { describe, it, expect } from "vitest";
import { sameLocation, pushLocation, replaceLocation, popLocation } from "../src/hooks/useAppNavigation.js";

describe("sameLocation", () => {
  it("location con lo stesso contenuto sono uguali anche da oggetti distinti", () => {
    expect(sameLocation({ screen: "recipes" }, { screen: "recipes" })).toBe(true);
  });
  it("location con contenuto diverso non sono uguali", () => {
    expect(sameLocation({ screen: "recipes" }, { screen: "book" })).toBe(false);
  });
});

describe("pushLocation", () => {
  it("aggiunge una location diversa dalla cima", () => {
    const stack = [{ screen: "landing" }];
    expect(pushLocation(stack, { screen: "recipes" })).toEqual([{ screen: "landing" }, { screen: "recipes" }]);
  });
  it("scarta un push duplicato della cima (stesso screen)", () => {
    const stack = [{ screen: "landing" }, { screen: "addRecipeHub" }];
    const next = pushLocation(stack, { screen: "addRecipeHub" });
    expect(next).toBe(stack); // stessa identità: nessuna voce nuova
  });
  it("non de-duplica se la cima è diversa, anche se la location è già più sotto nella pila", () => {
    const stack = [{ screen: "recipes" }, { screen: "recipe" }];
    const next = pushLocation(stack, { screen: "recipes" });
    expect(next).toEqual([{ screen: "recipes" }, { screen: "recipe" }, { screen: "recipes" }]);
  });
});

describe("replaceLocation", () => {
  it("sostituisce la cima senza cambiare la lunghezza della pila", () => {
    const stack = [{ screen: "landing" }, { screen: "new" }];
    expect(replaceLocation(stack, { screen: "scan" })).toEqual([{ screen: "landing" }, { screen: "scan" }]);
  });
});

describe("popLocation", () => {
  it("toglie la cima quando c'è più di una voce", () => {
    const stack = [{ screen: "landing" }, { screen: "recipes" }, { screen: "recipe" }];
    expect(popLocation(stack)).toEqual([{ screen: "landing" }, { screen: "recipes" }]);
  });
  it("non scende sotto la base (una sola voce)", () => {
    const stack = [{ screen: "landing" }];
    expect(popLocation(stack)).toEqual([{ screen: "landing" }]);
  });
});
