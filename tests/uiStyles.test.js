import { describe, it, expect } from "vitest";
import { resolveUiStyle, UI_STYLES, DEFAULT_UI_STYLE_ID, isUiStyleId, sectionColor, alpha } from "../src/data/uiStyles.js";
import { BOOK_THEMES } from "../src/data/constants.js";

const classicTheme = BOOK_THEMES.find(t => t.id === "classic");

describe("isUiStyleId", () => {
  it("riconosce i tre stili validi", () => {
    expect(isUiStyleId("classico")).toBe(true);
    expect(isUiStyleId("quaderno")).toBe(true);
    expect(isUiStyleId("schedario")).toBe(true);
  });
  it("rifiuta id sconosciuti o assenti", () => {
    expect(isUiStyleId("altro")).toBe(false);
    expect(isUiStyleId(undefined)).toBe(false);
    expect(isUiStyleId(null)).toBe(false);
  });
});

describe("resolveUiStyle — classico riproduce l'aspetto attuale", () => {
  const ui = resolveUiStyle(classicTheme, "classico");

  it("non applica alcun tint: bg/card coincidono col tema", () => {
    expect(ui.bg).toBe(classicTheme.appBg);
    expect(ui.card).toBe(classicTheme.appCard);
  });
  it("nav in alto, filtri sempre aperti, card con ombra", () => {
    expect(ui.navPosition).toBe("top");
    expect(ui.filters).toBe("expanded");
    expect(ui.surface).toBe("card");
    expect(ui.shadow).not.toBe("none");
  });
  it("cardStyle usa il colore pieno della card, non trasparente", () => {
    expect(ui.cardStyle.background).toBe(classicTheme.appCard);
    expect(ui.cardStyle.boxShadow).not.toBe("none");
  });
});

describe("resolveUiStyle — quaderno/schedario", () => {
  it("quaderno: nav in basso, filtri dietro foglio, niente card (surface plain)", () => {
    const ui = resolveUiStyle(classicTheme, "quaderno");
    expect(ui.navPosition).toBe("bottom");
    expect(ui.filters).toBe("sheet");
    expect(ui.surface).toBe("plain");
    expect(ui.cardStyle.background).toBe("transparent");
  });
  it("schedario: nav in basso, card piatte (surface flat, niente ombra)", () => {
    const ui = resolveUiStyle(classicTheme, "schedario");
    expect(ui.navPosition).toBe("bottom");
    expect(ui.surface).toBe("flat");
    expect(ui.shadow).toBe("none");
  });
  it("id sconosciuto ricade su classico (default)", () => {
    const ui = resolveUiStyle(classicTheme, "inesistente");
    expect(ui.id).toBe(DEFAULT_UI_STYLE_ID);
  });
});

describe("resolveUiStyle — colori derivati dal tema, mai hardcoded per stile", () => {
  it("ogni stile risolto usa i colori accent/ink/faded del tema passato", () => {
    UI_STYLES.forEach(style => {
      const ui = resolveUiStyle(classicTheme, style.id);
      expect(ui.accent).toBe(classicTheme.appAccent);
      expect(ui.accent2).toBe(classicTheme.appAccent2);
      expect(ui.ink).toBe(classicTheme.appInk);
      expect(ui.faded).toBe(classicTheme.appFaded);
      expect(ui.border).toBe(classicTheme.appBorder);
    });
  });
  it("un tema diverso produce colori derivati diversi (nessun default hardcoded)", () => {
    const forest = BOOK_THEMES.find(t => t.id === "forest");
    const uiClassic = resolveUiStyle(classicTheme, "quaderno");
    const uiForest = resolveUiStyle(forest, "quaderno");
    expect(uiForest.ink).toBe(forest.appInk);
    expect(uiForest.ink).not.toBe(uiClassic.ink);
  });
});

describe("sectionColor — palette terrosa profonda (DECISIONI.md)", () => {
  it("restituisce un colore per ciascuna delle quattro sezioni note", () => {
    ["basi", "salati", "dolci", "altro"].forEach(id => {
      const c = sectionColor(id);
      expect(c.full).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.pill).toMatch(/^rgba\(/);
    });
  });
  it("una sezione sconosciuta ricade su 'altro'", () => {
    expect(sectionColor("non-esiste")).toEqual(sectionColor("altro"));
    expect(sectionColor(undefined)).toEqual(sectionColor("altro"));
  });
});

describe("alpha", () => {
  it("converte un esadecimale in rgba con la trasparenza data", () => {
    expect(alpha("#C4593A", 0.5)).toBe("rgba(196,89,58,0.5)");
  });
});
