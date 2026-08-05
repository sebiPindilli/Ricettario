// Fase N — logica di chiamata a Gemini + estrazione/normalizzazione del
// JSON ricetta, spostata qui (prima duplicata in ScanScreen.jsx e
// AddFromLinkScreen.jsx) e usata solo lato server: la chiave API non
// deve mai arrivare al browser.

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

// Normalizza le chiavi (inglese/italiano) e i formati estratti dall'AI
function normalizeRecipeJson(parsed) {
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
  norm.ingredients = rawIngs.map(ing => {
    let name = ing.name || ing.ingrediente || ing.nome || "";
    let qty = ing.qty || ing.dose || ing.quantita || ing.quantity || "";
    let unit = ing.unit || ing.unita || ing.unita_misura || "";

    if (typeof qty === "string") {
      const parsedQty = parseFloat(qty.replace(/,/g, "."));
      if (!isNaN(parsedQty)) qty = parsedQty;
    }
    return { name, qty, unit };
  });

  norm.steps = parsed.steps || parsed.passaggi || parsed.istruzioni || parsed.preparazione || [];
  if (typeof norm.steps === "string") {
    norm.steps = norm.steps.split("\n").map(s => s.trim()).filter(Boolean);
  }

  norm.emoji = parsed.emoji || "🍝";
  norm.color = parsed.color || "#C4593A";

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
  "color": "un_codice_colore_esadecimale_adatto_es_#C4593A"
}

Note importanti per l'estrazione:
- Nel campo "ingredients", estrai separatamente il nome dell'ingrediente, la quantità (deve essere un numero o null se non specificata, es. per "q.b.") e l'unità di misura (es. "g", "ml", "cucchiai", "pizzico", o stringa vuota se sono pezzi interi).
- Se mancano dettagli come tempi o porzioni, stima un valore ragionevole o inserisci 0.`;

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
    generationConfig: { responseMimeType: "application/json" },
  };

  return callGemini(payload);
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

  if (targetUrl && !manualText) {
    const queryText = `${PROMPT_BASE}\n\nUsa lo strumento di ricerca Google Search per accedere a questo URL, leggere la ricetta ed estrarre tutti i dettagli in formato JSON strutturato: ${targetUrl}`;
    payload = {
      contents: [{ parts: [{ text: queryText }] }],
      tools: [{ google_search: {} }],
    };
    usedUrl = targetUrl;
  } else {
    const truncatedHtml = manualText.substring(0, 120000);
    payload = {
      contents: [{
        parts: [
          { text: PROMPT_BASE },
          { text: `Ecco il contenuto del testo/HTML da analizzare per estrarre la ricetta:\n\n${truncatedHtml}` },
        ],
      }],
      generationConfig: { responseMimeType: "application/json" },
    };
  }

  const ocrData = await callGemini(payload);
  if (usedUrl) ocrData.sourceUrl = usedUrl;
  return ocrData;
}
