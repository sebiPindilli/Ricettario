// Fase N — logica di chiamata a Gemini + estrazione/normalizzazione del
// JSON ricetta, spostata qui (prima duplicata in ScanScreen.jsx e
// AddFromLinkScreen.jsx) e usata solo lato server: la chiave API non
// deve mai arrivare al browser.
import { extractStructuredRecipeFields } from "./recipeSchemaOrg.js";
import { stripHtmlToText } from "./htmlToText.js";

// Helper per estrarre in modo ultra-robusto l'oggetto JSON del ricettario
// isolando i blocchi a parentesi bilanciate (utile se il modello include
// pensieri o testo extra).
function extractRecipeJson(text) {
  const blocks = [];
  let openBraces = 0;
  let startIdx = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (openBraces === 0) startIdx = i;
      openBraces++;
    } else if (text[i] === "}") {
      if (openBraces > 0) {
        openBraces--;
        if (openBraces === 0 && startIdx !== -1) {
          blocks.push(text.substring(startIdx, i + 1));
        }
      }
    }
  }

  for (let i = blocks.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(blocks[i]);
      if (parsed && (parsed.title || parsed.titolo || parsed.ingredients || parsed.ingredienti || parsed.steps || parsed.passaggi)) {
        return parsed;
      }
    } catch (e) {}
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } catch (e) {}
  }

  throw new Error("Nessun oggetto ricetta JSON valido trovato nella risposta.");
}

// Un ingrediente/step può arrivare sezionato ({section, items}) quando la
// fonte raggruppa esplicitamente il contenuto in sottosezioni ("Per
// l'impasto", "Per la farcitura") — vedi l'istruzione in PROMPT_BASE.
// Duplica minimamente la stessa identica logica di src/utils/helpers.js
// (isSectioned) invece di importarla: questo file gira come function
// server (Vercel), deve restare autonomo dal bundle client.
const isSectionedRaw = (arr) =>
  Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object" && arr[0] !== null && "section" in arr[0];

function normalizeIngredientOne(ing) {
  let name = ing.name || ing.ingrediente || ing.nome || "";
  let qty = ing.qty || ing.dose || ing.quantita || ing.quantity || "";
  let unit = ing.unit || ing.unita || ing.unita_misura || "";

  if (typeof qty === "string") {
    const parsedQty = parseFloat(qty.replace(/,/g, "."));
    if (!isNaN(parsedQty)) qty = parsedQty;
  }
  return { name, qty, unit };
}

// Normalizza le chiavi (inglese/italiano) e i formati estratti dall'AI
export function normalizeRecipeJson(parsed) {
  const norm = {};

  norm.title = parsed.title || parsed.titolo || parsed.name || parsed.nome || "";

  norm.prepTime = parsed.prepTime || parsed.tempoPreparazione || parsed.tempo_preparazione || (parsed.tempi?.preparazione ? parseInt(parsed.tempi.preparazione) : 0) || 0;
  norm.cookTime = parsed.cookTime || parsed.tempoCottura || parsed.tempo_cottura || (parsed.tempi?.cottura ? parseInt(parsed.tempi.cottura) : 0) || 0;

  if (typeof norm.prepTime === "string") {
    norm.prepTime = parseInt(norm.prepTime.replace(/[^0-9]/g, "")) || 0;
  }
  if (typeof norm.cookTime === "string") {
    norm.cookTime = parseInt(norm.cookTime.replace(/[^0-9]/g, "")) || 0;
  }

  norm.servings = parsed.servings || parsed.porzioni || 4;
  if (typeof norm.servings === "string") {
    norm.servings = parseInt(norm.servings.replace(/[^0-9]/g, "")) || 4;
  }

  norm.note = parsed.note || parsed.consigli || parsed.descrizione || "";

  const rawIngs = parsed.ingredients || parsed.ingredienti || [];
  norm.ingredients = isSectionedRaw(rawIngs)
    ? rawIngs.map(sec => ({ section: sec.section || "", items: (sec.items || []).map(normalizeIngredientOne) }))
    : rawIngs.map(normalizeIngredientOne);

  const rawSteps = parsed.steps || parsed.passaggi || parsed.istruzioni || parsed.preparazione || [];
  if (typeof rawSteps === "string") {
    norm.steps = rawSteps.split("\n").map(s => s.trim()).filter(Boolean);
  } else if (isSectionedRaw(rawSteps)) {
    norm.steps = rawSteps.map(sec => ({ section: sec.section || "", items: sec.items || [] }));
  } else {
    norm.steps = rawSteps;
  }

  norm.emoji = parsed.emoji || "🍝";
  norm.color = parsed.color || "#C4593A";
  norm.source = parsed.source || parsed.fonte || "";

  return norm;
}

const PROMPT_BASE = `Sei un esperto assistente culinario. Analizza la ricetta fornita ed estrai tutte le informazioni utili.
Restituisci esclusivamente un oggetto JSON ben formato che rispetta esattamente questo schema, senza alcun commento o blocco di codice markdown (NON inserire \`\`\`json all'inizio e \`\`\` alla fine):
{
  "title": "Titolo identificativo della ricetta",
  "prepTime": tempo_preparazione_in_minuti_numero,
  "cookTime": tempo_cottura_in_minuti_numero,
  "servings": porzioni_numero,
  "note": "Eventuali note, consigli, varianti o informazioni aggiuntive",
  "ingredients": [
    { "name": "nome dell'ingrediente", "qty": quantita_numero_o_null, "unit": "unita_misura_o_vuoto" }
  ],
  "steps": [
    "Descrizione del primo passaggio",
    "Descrizione del secondo passaggio"
  ],
  "emoji": "una_singola_emoji_rappresentativa_del_piatto",
  "color": "un_codice_colore_esadecimale_adatto_es_#C4593A",
  "source": "nome del sito/pubblicazione da cui proviene la ricetta, se determinabile, altrimenti stringa vuota"
}

Note importanti per l'estrazione:
- Nel campo "ingredients", estrai separatamente il nome dell'ingrediente, la quantità (deve essere un numero o null se non specificata, es. per "q.b.") e l'unità di misura (es. "g", "ml", "cucchiai", "pizzico", o stringa vuota se sono pezzi interi).
- Sii rigorosamente fedele alla fonte: NON inventare, stimare o riformulare informazioni che non sono chiaramente presenti. Se un'informazione testuale (titolo, nota, nome/unità di un ingrediente, un passaggio) non è chiaramente leggibile o presente, scrivi esattamente "?" in quel campo invece di indovinare.
- Se la fonte raggruppa esplicitamente ingredienti e/o passaggi in sottosezioni con un titolo proprio (es. "Per l'impasto", "Per la farcitura"), restituisci quel campo ("ingredients" e/o "steps", indipendentemente l'uno dall'altro) come array di sezioni: [{"section":"Nome visto nella fonte","items":[...stessi elementi della lista piatta...]}]. Se una parte degli elementi non ha un titolo di sottosezione proprio mentre il resto sì, usa "section":"" per quel gruppo, mantenendo l'ordine originale. NON creare sottosezioni se la fonte non le presenta affatto: in quel caso il campo resta piatto come sopra. NON inventare nomi di sottosezione che non compaiono nella fonte.
- "ingredients" e "steps" vanno valutati in modo completamente indipendente per la sottosezionatura: è comunissimo che la fonte divida in sottosezioni SOLO gli ingredienti (es. "Per il vitello"/"Per la salsa") mentre i passaggi restano un unico elenco numerato senza alcun titolo, o viceversa. NON dedurre né "specchiare" le sottosezioni di un campo su quelle dell'altro: se hai anche il minimo dubbio che i passaggi abbiano davvero un proprio titolo di sottosezione nella fonte, lascia "steps" come elenco piatto invece di inventare una sezione — un elenco piatto corretto è sempre preferibile a una sezione sbagliata con contenuti mancanti o forzati a "?".
- Per i campi numerici (prepTime, cookTime, servings, qty di un ingrediente): se non è chiaramente specificato, usa 0 (per tempi/porzioni) o null (per qty) — mai un numero stimato o inventato.
- prepTime, cookTime e servings spesso non sono nel testo principale della ricetta ma in un riquadro/barra informazioni separata vicino al titolo (spesso con icone tipo orologio o persone) — cercali attivamente lì prima di concludere che manchino, non limitarti a leggere solo il corpo degli ingredienti/passaggi.
- Se la fonte indica un unico "tempo totale" senza distinguere preparazione e cottura, NON dividerlo arbitrariamente tra i due campi: metti l'intero valore in cookTime e lascia prepTime a 0.
- Per il campo "source": se stai analizzando una pagina web, usa il nome leggibile del sito o della pubblicazione (es. "GialloZafferano", non "giallozafferano.it") se lo individui dalla pagina; se non è determinabile, o se stai analizzando solo delle foto (nessuna pagina web), lascia il campo vuoto.`;

function geminiUrl() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurata lato server.");
  const modelName = process.env.GEMINI_MODEL || "gemma-4-31b-it";
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
}

async function callGemini(payload) {
  const response = await fetch(geminiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errorMsg = `Errore API Gemini (${response.status})`;
    try {
      const parsedErr = JSON.parse(errText);
      if (parsedErr.error?.message) errorMsg = parsedErr.error.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const resData = await response.json();
  const parts = resData.candidates?.[0]?.content?.parts || [];
  const textResponse = parts.filter(p => p.text).map(p => p.text).join("\n");

  if (!textResponse) {
    throw new Error("Il modello non ha restituito una risposta valida.");
  }

  return normalizeRecipeJson(extractRecipeJson(textResponse));
}

// images: [{ base64, mimeType }, ...]
export async function parseRecipeFromImages(images) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("Nessuna immagine fornita.");
  }
  const promptText = `${PROMPT_BASE}

Analizza le immagini di questa ricetta (che potrebbero essere più pagine, note scritte a mano o parti diverse) ed estrai tutte le informazioni combinandole in un'unica ricetta. Cerca di ripulire i testi da eventuali errori di lettura OCR mantenendo la ricetta fedele, completa e naturale, unendo le informazioni di tutte le foto inserite.`;

  const imageParts = images.map(img => ({
    inlineData: { mimeType: img.mimeType, data: img.base64 },
  }));

  const payload = {
    contents: [{ parts: [{ text: promptText }, ...imageParts] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  };

  return callGemini(payload);
}

// Scarica una pagina lato server con un margine di tempo limitato. null se
// va storto in qualunque modo (rete, timeout, blocco, risposta non HTML):
// il chiamante ripiega sul tool di ricerca di Gemini invece di far fallire
// tutta l'estrazione — lo User-Agent da browser reale serve solo a evitare
// i blocchi generici verso client sconosciuti, non a eludere alcuna
// protezione mirata: è comunque un import esplicito richiesto dall'utente.
const FETCH_PAGE_TIMEOUT_MS = 8000;
async function fetchPageHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_PAGE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("html") && !contentType.includes("text")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// { url } oppure { text } (testo/HTML incollato manualmente)
export async function parseRecipeFromLink({ url, text }) {
  const targetUrl = (url || "").trim();
  const manualText = (text || "").trim();

  if (!targetUrl && !manualText) {
    throw new Error("Fornisci un URL oppure del testo/HTML da analizzare.");
  }

  let payload;
  let usedUrl = null;
  let fetchedHtml = null;

  if (targetUrl && !manualText) {
    fetchedHtml = await fetchPageHtml(targetUrl);
  }

  if (fetchedHtml) {
    // Scaricata da noi: il contenuto va a Gemini come testo, stesso ramo
    // dell'incolla manuale — più diretto e affidabile del tool di ricerca,
    // che raggiunge la pagina in modo indiretto. Ripulito in testo semplice
    // (via stripHtmlToText) prima dell'invio: l'HTML grezzo (tag, script,
    // stili, commenti, banner) non serve all'estrazione ma consuma token
    // della richiesta — su pagine anche solo medie può far scattare i
    // limiti di uso dell'API. I dati strutturati vengono comunque estratti
    // dall'HTML originale non ripulito (vedi extractStructuredRecipeFields
    // più sotto), che ha bisogno dei tag <script> intatti.
    const truncatedText = stripHtmlToText(fetchedHtml).substring(0, 40000);
    payload = {
      contents: [{
        parts: [
          { text: PROMPT_BASE },
          { text: `Ecco il testo della pagina da analizzare per estrarre la ricetta:\n\n${truncatedText}` },
        ],
      }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    };
    usedUrl = targetUrl;
  } else if (targetUrl && !manualText) {
    // Download diretto non riuscito (rete, timeout, blocco) — ripiega sul
    // tool di ricerca di Gemini, che raggiunge la pagina in altro modo.
    const queryText = `${PROMPT_BASE}\n\nUsa lo strumento di ricerca Google Search per accedere a questo URL, leggere la ricetta ed estrarre tutti i dettagli in formato JSON strutturato: ${targetUrl}`;
    payload = {
      contents: [{ parts: [{ text: queryText }] }],
      tools: [{ google_search: {} }],
    };
    usedUrl = targetUrl;
  } else {
    const truncatedText = stripHtmlToText(manualText).substring(0, 40000);
    payload = {
      contents: [{
        parts: [
          { text: PROMPT_BASE },
          { text: `Ecco il contenuto del testo/HTML da analizzare per estrarre la ricetta:\n\n${truncatedText}` },
        ],
      }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    };
  }

  const ocrData = await callGemini(payload);

  // Correzione dai dati strutturati Schema.org (JSON-LD), quando presenti
  // nell'HTML avuto a disposizione — scritti dal sito stesso, più
  // affidabili di quanto un modello possa leggerli dalla pagina. Corregge
  // solo i campi che trova: mai un azzeramento di un valore che Gemini
  // aveva già estratto correttamente.
  const sourceHtml = fetchedHtml || manualText || null;
  if (sourceHtml) {
    Object.assign(ocrData, extractStructuredRecipeFields(sourceHtml));
  }

  if (usedUrl) {
    ocrData.sourceUrl = usedUrl;
    // Se l'AI non ha individuato un nome leggibile del sito, ripiega sul
    // dominio pulito dell'URL fornito dall'utente (sempre disponibile).
    if (!ocrData.source) {
      try { ocrData.source = new URL(usedUrl).hostname.replace(/^www\./, ""); } catch (_) {}
    }
  }
  return ocrData;
}
