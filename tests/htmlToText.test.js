import { describe, it, expect } from "vitest";
import { stripHtmlToText } from "../lib/htmlToText.js";

describe("stripHtmlToText — casi base", () => {
  it("rimuove script/style/commenti senza lasciarne il contenuto", () => {
    const html = `<html><head><style>.a{color:red}</style><script>alert(1)</script></head>
      <body><!-- nota interna --><p>Torta di mele</p></body></html>`;
    const text = stripHtmlToText(html);
    expect(text).not.toContain("color:red");
    expect(text).not.toContain("alert(1)");
    expect(text).not.toContain("nota interna");
    expect(text).toContain("Torta di mele");
  });

  it("rimuove nav/header/footer", () => {
    const html = `<nav>Menu sito</nav><header>Intestazione</header><main>Ricetta vera</main><footer>Copyright</footer>`;
    const text = stripHtmlToText(html);
    expect(text).not.toContain("Menu sito");
    expect(text).not.toContain("Intestazione");
    expect(text).not.toContain("Copyright");
    expect(text).toContain("Ricetta vera");
  });

  it("decodifica le entità HTML comuni", () => {
    expect(stripHtmlToText("<p>Farina &amp; zucchero &egrave; buono</p>")).toContain("Farina & zucchero");
    expect(stripHtmlToText("<p>200&nbsp;g</p>")).toContain("200 g");
  });

  it("mantiene leggibile la struttura andando a capo sui tag di blocco", () => {
    const text = stripHtmlToText("<p>Primo passaggio</p><p>Secondo passaggio</p>");
    expect(text.split("\n").map(s => s.trim()).filter(Boolean)).toEqual(["Primo passaggio", "Secondo passaggio"]);
  });

  it("riduce drasticamente la dimensione rispetto all'HTML grezzo (obiettivo: meno token verso Gemini)", () => {
    const boilerplate = "<div class=\"tracking-pixel\" data-x=\"1\">".repeat(200);
    const html = `${boilerplate}<p>Ricetta reale qui</p>`;
    const text = stripHtmlToText(html);
    expect(text.length).toBeLessThan(html.length / 5);
    expect(text).toContain("Ricetta reale qui");
  });

  it("input vuoto/non stringa: stringa vuota, nessun errore", () => {
    expect(stripHtmlToText("")).toBe("");
    expect(stripHtmlToText(null)).toBe("");
    expect(stripHtmlToText(undefined)).toBe("");
  });

  it("testo semplice senza tag passa sostanzialmente invariato", () => {
    expect(stripHtmlToText("Solo testo semplice, niente HTML.")).toBe("Solo testo semplice, niente HTML.");
  });
});
