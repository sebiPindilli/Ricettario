import { describe, it, expect } from "vitest";
import { resolveUiStyle, buildTheme, UI_STYLES, DEFAULT_UI_STYLE_ID, isUiStyleId, alpha, navPadBottom } from "../src/data/uiStyles.js";
import { DEFAULT_PALETTE_ID } from "../src/data/palettes.js";

const theme = buildTheme(DEFAULT_PALETTE_ID, false);

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
  const ui = resolveUiStyle(theme, "classico");

  it("non applica alcun tint: bg/card coincidono col tema", () => {
    expect(ui.bg).toBe(theme.appBg);
    expect(ui.card).toBe(theme.appCard);
  });
  it("nav in alto, filtri sempre aperti, card con ombra", () => {
    expect(ui.navPosition).toBe("top");
    expect(ui.filters).toBe("expanded");
    expect(ui.surface).toBe("card");
    expect(ui.shadow).not.toBe("none");
  });
  it("cardStyle usa il colore pieno della card, non trasparente", () => {
    expect(ui.cardStyle.background).toBe(theme.appCard);
    expect(ui.cardStyle.boxShadow).not.toBe("none");
  });
});

describe("resolveUiStyle — quaderno/schedario", () => {
  it("quaderno: nav in basso, filtri dietro foglio, niente card (surface plain)", () => {
    const ui = resolveUiStyle(theme, "quaderno");
    expect(ui.navPosition).toBe("bottom");
    expect(ui.filters).toBe("sheet");
    expect(ui.surface).toBe("plain");
    expect(ui.cardStyle.background).toBe("transparent");
  });
  it("schedario: nav in basso, card piatte (surface flat, niente ombra)", () => {
    const ui = resolveUiStyle(theme, "schedario");
    expect(ui.navPosition).toBe("bottom");
    expect(ui.surface).toBe("flat");
    expect(ui.shadow).toBe("none");
  });
  it("id sconosciuto ricade su classico (default)", () => {
    const ui = resolveUiStyle(theme, "inesistente");
    expect(ui.id).toBe(DEFAULT_UI_STYLE_ID);
  });
});

describe("resolveUiStyle — colori derivati dal tema, mai hardcoded per stile", () => {
  it("ogni stile risolto usa i colori accent/ink/faded del tema passato", () => {
    UI_STYLES.forEach(style => {
      const ui = resolveUiStyle(theme, style.id);
      expect(ui.accent).toBe(theme.appAccent);
      expect(ui.accent2).toBe(theme.appAccent2);
      expect(ui.ink).toBe(theme.appInk);
      expect(ui.faded).toBe(theme.appFaded);
      expect(ui.border).toBe(theme.appBorder);
    });
  });
  it("una palette diversa produce colori derivati diversi (nessun default hardcoded)", () => {
    const scuro = buildTheme(DEFAULT_PALETTE_ID, true);
    const uiChiaro = resolveUiStyle(theme, "quaderno");
    const uiScuro = resolveUiStyle(scuro, "quaderno");
    expect(uiScuro.ink).toBe(scuro.appInk);
    expect(uiScuro.ink).not.toBe(uiChiaro.ink);
  });
});

describe("buildTheme / sectionColor — Fase 6 (PALETTE.md)", () => {
  it("buildTheme espone un colore per ciascuna delle quattro sezioni note", () => {
    ["basi", "salati", "dolci", "altro"].forEach(id => {
      expect(theme.sezioni[id]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.sezioniPiene[id]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
  it("ui.sectionColor è null in classico (resta recipe.color)", () => {
    const ui = resolveUiStyle(theme, "classico");
    expect(ui.sectionColor("basi")).toBe(null);
  });
  it("ui.sectionColor risolve le quattro sezioni note in quaderno/schedario", () => {
    ["quaderno", "schedario"].forEach(id => {
      const ui = resolveUiStyle(theme, id);
      ["basi", "salati", "dolci", "altro"].forEach(sectionId => {
        expect(ui.sectionColor(sectionId)).toBe(theme.sezioni[sectionId]);
      });
    });
  });
  it("una sezione sconosciuta ricade su 'altro'", () => {
    const ui = resolveUiStyle(theme, "quaderno");
    expect(ui.sectionColor("non-esiste")).toBe(theme.sezioni.altro);
    expect(ui.sectionColor(undefined)).toBe(theme.sezioni.altro);
  });
});

describe("alpha", () => {
  it("converte un esadecimale in rgba con la trasparenza data", () => {
    expect(alpha("#C4593A", 0.5)).toBe("rgba(196,89,58,0.5)");
  });
});

// Un token per fase (IMPLEMENTATION_PLAN.md, "nuove istruzioni"): se un
// componente non lo legge, quella fase non è fatta. Qui si verifica solo
// che resolveUiStyle lo esponga con i valori attesi — la lettura nei
// componenti la verificano i rispettivi commit.
describe("resolveUiStyle — token per fase (Fase 6-11)", () => {
  it("classico: tutti i punti di scelta sono sul valore 'di sempre'", () => {
    const ui = resolveUiStyle(theme, "classico");
    expect(ui.header).toBe("legacy");
    expect(ui.dialogTabs).toBe(false);
    expect(ui.timer).toBe("fab");
    expect(ui.fields).toBe("labeled");
    expect(ui.iconPicker).toBe("screen");
    expect(ui.tables).toBe("plain");
    expect(ui.formSections).toBe("open");
    expect(ui.exportFlow).toBe("legacy");
    expect(ui.booksLayout).toBe("cards");
    expect(ui.stripe).toBe("transparent");
    expect(ui.sectionColor("basi")).toBe(null);
  });
  it("quaderno/schedario: tutti i punti di scelta sono sul valore nuovo", () => {
    ["quaderno", "schedario"].forEach(id => {
      const ui = resolveUiStyle(theme, id);
      expect(ui.dialogTabs).toBe(true);
      expect(ui.timer).toBe("strip");
      expect(ui.fields).toBe("placeholder");
      expect(ui.iconPicker).toBe("sheet");
      expect(ui.tables).toBe("striped");
      expect(ui.formSections).toBe("accordion");
      expect(ui.exportFlow).toBe("guided");
      expect(ui.booksLayout).toBe("list");
      expect(["rule", "bar"]).toContain(ui.header);
      expect(ui.stripe).toMatch(/^rgba\(/);
      expect(ui.sectionColor("basi")).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe("navPadBottom", () => {
  it("è un solo punto di verità: calc(10px + safe-area)", () => {
    expect(navPadBottom).toBe("calc(10px + env(safe-area-inset-bottom, 0px))");
  });
});
