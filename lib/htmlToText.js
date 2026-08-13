// Ripulisce l'HTML di una pagina in testo semplice leggibile, prima di
// mandarlo a Gemini come prompt — l'HTML grezzo (tag, attributi, script,
// fogli di stile, commenti, banner cookie, tracker) non aggiunge nulla
// all'estrazione della ricetta ma consuma comunque token della richiesta:
// su pagine anche solo medie può far scattare i limiti di uso dell'API.
// Nessuna dipendenza da un parser HTML vero: la pulizia non deve essere
// perfetta, solo abbastanza per togliere il rumore prima di Gemini — i
// dati strutturati (Schema.org) restano estratti dall'HTML originale non
// ripulito, vedi recipeSchemaOrg.js.
const HTML_ENTITIES = {
  "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
  "&quot;": '"', "&#39;": "'", "&apos;": "'",
};

export function stripHtmlToText(html) {
  if (typeof html !== "string" || !html) return "";
  let text = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ");

  // I tag di blocco diventano un a-capo, per mantenere leggibile la
  // struttura (titoli/paragrafi/voci di lista su righe separate) invece
  // di appiattire tutto su un'unica riga.
  text = text.replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");

  text = text.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (m) => HTML_ENTITIES[m] || m);
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));

  text = text.replace(/[ \t]+/g, " ").replace(/\n[ \t]*\n+/g, "\n").trim();
  return text;
}
