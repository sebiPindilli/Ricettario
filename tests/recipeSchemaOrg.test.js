import { describe, it, expect } from "vitest";
import { extractStructuredRecipeFields } from "../lib/recipeSchemaOrg.js";

const withScript = (jsonBody) => `<html><head><script type="application/ld+json">${jsonBody}</script></head><body></body></html>`;

describe("extractStructuredRecipeFields — casi base", () => {
  it("estrae prepTime/cookTime/servings da un blocco Recipe semplice", () => {
    const html = withScript(JSON.stringify({
      "@context": "https://schema.org", "@type": "Recipe",
      name: "Torta", prepTime: "PT20M", cookTime: "PT1H30M", recipeYield: "8 servings",
    }));
    expect(extractStructuredRecipeFields(html)).toEqual({ prepTime: 20, cookTime: 90, servings: 8 });
  });

  it("nessuno script ld+json: ritorna oggetto vuoto", () => {
    expect(extractStructuredRecipeFields("<html><body>niente qui</body></html>")).toEqual({});
  });

  it("html vuoto o non stringa: ritorna oggetto vuoto senza errori", () => {
    expect(extractStructuredRecipeFields("")).toEqual({});
    expect(extractStructuredRecipeFields(null)).toEqual({});
    expect(extractStructuredRecipeFields(undefined)).toEqual({});
  });

  it("include solo i campi effettivamente presenti/riconosciuti (mai azzerare gli altri)", () => {
    const html = withScript(JSON.stringify({ "@type": "Recipe", cookTime: "PT45M" }));
    expect(extractStructuredRecipeFields(html)).toEqual({ cookTime: 45 });
  });
});

describe("extractStructuredRecipeFields — varianti del markup", () => {
  it("@type come array che include 'Recipe'", () => {
    const html = withScript(JSON.stringify({ "@type": ["Recipe", "NewsArticle"], prepTime: "PT10M" }));
    expect(extractStructuredRecipeFields(html)).toEqual({ prepTime: 10 });
  });

  it("wrapper @graph con più entità, una delle quali è Recipe", () => {
    const html = withScript(JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebPage", name: "Pagina" },
        { "@type": "Recipe", prepTime: "PT5M", cookTime: "PT15M", recipeYield: 4 },
      ],
    }));
    expect(extractStructuredRecipeFields(html)).toEqual({ prepTime: 5, cookTime: 15, servings: 4 });
  });

  it("recipeYield come array di stringhe prende il primo numero", () => {
    const html = withScript(JSON.stringify({ "@type": "Recipe", recipeYield: ["6 porzioni"] }));
    expect(extractStructuredRecipeFields(html)).toEqual({ servings: 6 });
  });

  it("più blocchi script: ignora quelli non-Recipe/malformati e usa il primo valido", () => {
    const html = `
      <script type="application/ld+json">{ "@type": "WebSite", "name": "Sito" }</script>
      <script type="application/ld+json">questo non è JSON valido</script>
      <script type="application/ld+json">${JSON.stringify({ "@type": "Recipe", prepTime: "PT8M" })}</script>
    `;
    expect(extractStructuredRecipeFields(html)).toEqual({ prepTime: 8 });
  });

  it("nessun nodo Recipe in nessun blocco: ritorna oggetto vuoto", () => {
    const html = withScript(JSON.stringify({ "@type": "WebPage", name: "Non una ricetta" }));
    expect(extractStructuredRecipeFields(html)).toEqual({});
  });
});

describe("extractStructuredRecipeFields — durate ISO 8601", () => {
  it("PT2H (sole ore)", () => {
    const html = withScript(JSON.stringify({ "@type": "Recipe", cookTime: "PT2H" }));
    expect(extractStructuredRecipeFields(html)).toEqual({ cookTime: 120 });
  });

  it("durata non in formato ISO riconoscibile: campo omesso, non un errore", () => {
    const html = withScript(JSON.stringify({ "@type": "Recipe", prepTime: "20 minuti" }));
    expect(extractStructuredRecipeFields(html)).toEqual({});
  });
});
