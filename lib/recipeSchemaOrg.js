// Estrazione di dati strutturati Schema.org (JSON-LD, <script
// type="application/ld+json"> con "@type":"Recipe") da una pagina di
// ricetta. La maggior parte dei siti di ricette li incorpora per farsi
// indicizzare bene da Google: prepTime/cookTime/recipeYield sono numeri
// scritti dal sito stesso, quindi più affidabili di quanto un modello
// possa "leggere" dalla pagina. Usati in lib/gemini.js per CORREGGERE i
// soli campi numerici del risultato di Gemini quando presenti — mai per
// sostituire l'estrazione intera (ingredienti/passaggi restano sempre
// interpretati da Gemini, che gestisce anche i siti senza questo markup).

// "PT20M", "PT1H30M", "PT2H" → minuti. null se non riconosciuto.
function parseIsoDuration(iso) {
  if (typeof iso !== "string") return null;
  const m = iso.trim().match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  const hours = parseInt(m[1] || "0", 10);
  const minutes = parseInt(m[2] || "0", 10);
  const seconds = parseInt(m[3] || "0", 10);
  return hours * 60 + minutes + Math.round(seconds / 60);
}

// recipeYield può essere un numero, una stringa ("4 servings", "4-6") o un
// array di queste — prende il primo numero trovato. null se non ne trova.
function parseServingsYield(y) {
  const val = Array.isArray(y) ? y[0] : y;
  if (val == null) return null;
  const n = parseInt(String(val).replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? null : n;
}

// Un nodo è "Recipe" se @type è la stringa "Recipe" o un array che la
// contiene (case-insensitive: alcuni siti scrivono "recipe").
function isRecipeNode(node) {
  if (!node || typeof node !== "object") return false;
  const type = node["@type"];
  if (typeof type === "string") return type.toLowerCase() === "recipe";
  if (Array.isArray(type)) return type.some(t => typeof t === "string" && t.toLowerCase() === "recipe");
  return false;
}

// Cerca ricorsivamente un nodo Recipe in un valore JSON-LD già parsato —
// gestisce sia un oggetto singolo sia un array sia un wrapper "@graph"
// (pattern comune quando la pagina descrive più entità nello stesso blocco).
function findRecipeNode(json) {
  if (Array.isArray(json)) {
    for (const item of json) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (isRecipeNode(json)) return json;
  if (json && Array.isArray(json["@graph"])) return findRecipeNode(json["@graph"]);
  return null;
}

// Estrae { prepTime?, cookTime?, servings? } (minuti/numero) dall'HTML di
// una pagina — solo i campi effettivamente presenti e riconosciuti,
// nessun default: il chiamante corregge solo ciò che trova, senza mai
// azzerare un valore che Gemini aveva già estratto correttamente.
export function extractStructuredRecipeFields(html) {
  if (typeof html !== "string" || !html) return {};
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRe.exec(html)) !== null) {
    let json;
    try {
      json = JSON.parse(match[1].trim());
    } catch {
      continue;
    }
    const recipe = findRecipeNode(json);
    if (!recipe) continue;

    const out = {};
    const prep = parseIsoDuration(recipe.prepTime);
    const cook = parseIsoDuration(recipe.cookTime);
    const servings = parseServingsYield(recipe.recipeYield);
    if (prep != null) out.prepTime = prep;
    if (cook != null) out.cookTime = cook;
    if (servings != null) out.servings = servings;
    if (Object.keys(out).length > 0) return out;
  }
  return {};
}
