import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import BackBtn from "../components/BackBtn.jsx";
// Helper per estrarre in modo ultra-robusto l'oggetto JSON del ricettario
// isolando i blocchi a parentesi bilanciate (utile se Gemma 4 include pensieri o testo extra)
function extractRecipeJson(text) {
  const blocks = [];
  let openBraces = 0;
  let startIdx = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (openBraces === 0) {
        startIdx = i;
      }
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

  // Proviamo a parsare i blocchi in ordine inverso (la ricetta è tipicamente l'ultimo blocco)
  for (let i = blocks.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(blocks[i]);
      if (parsed && (parsed.title || parsed.titolo || parsed.ingredients || parsed.ingredienti || parsed.steps || parsed.passaggi)) {
        return parsed;
      }
    } catch (e) {}
  }

  // Fallback: cerca la prima e l'ultima parentesi graffa nel testo
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
  
  // 1. Titolo
  norm.title = parsed.title || parsed.titolo || parsed.name || parsed.nome || "";
  
  // 2. Tempi
  norm.prepTime = parsed.prepTime || parsed.tempoPreparazione || parsed.tempo_preparazione || (parsed.tempi?.preparazione ? parseInt(parsed.tempi.preparazione) : 0) || 0;
  norm.cookTime = parsed.cookTime || parsed.tempoCottura || parsed.tempo_cottura || (parsed.tempi?.cottura ? parseInt(parsed.tempi.cottura) : 0) || 0;
  
  if (typeof norm.prepTime === "string") {
    norm.prepTime = parseInt(norm.prepTime.replace(/[^0-9]/g, "")) || 0;
  }
  if (typeof norm.cookTime === "string") {
    norm.cookTime = parseInt(norm.cookTime.replace(/[^0-9]/g, "")) || 0;
  }

  // 3. Porzioni
  norm.servings = parsed.servings || parsed.porzioni || 4;
  if (typeof norm.servings === "string") {
    norm.servings = parseInt(norm.servings.replace(/[^0-9]/g, "")) || 4;
  }

  // 4. Note
  norm.note = parsed.note || parsed.consigli || parsed.descrizione || "";

  // 5. Ingredienti
  const rawIngs = parsed.ingredients || parsed.ingredienti || [];
  norm.ingredients = rawIngs.map(ing => {
    let name = ing.name || ing.ingrediente || ing.nome || "";
    let qty = ing.qty || ing.dose || ing.quantita || ing.quantity || "";
    let unit = ing.unit || ing.unita || ing.unita_misura || "";

    if (typeof qty === "string") {
      const parsedQty = parseFloat(qty.replace(/,/g, "."));
      if (!isNaN(parsedQty)) {
        qty = parsedQty;
      }
    }
    return { name, qty, unit };
  });

  // 6. Passaggi
  norm.steps = parsed.steps || parsed.passaggi || parsed.istruzioni || parsed.preparazione || [];
  if (typeof norm.steps === "string") {
    norm.steps = norm.steps.split("\n").map(s => s.trim()).filter(Boolean);
  }

  // 7. Estetica
  norm.emoji = parsed.emoji || "🍝";
  norm.color = parsed.color || "#C4593A";

  return norm;
}

export default function AddFromLinkScreen({ onBack, onSave }) {
  const th = useTheme();
  const [urlInput, setUrlInput] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualPaste, setShowManualPaste] = useState(false);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setHtmlContent(event.target.result);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    const targetUrl = urlInput.trim();
    const manualText = htmlContent.trim();

    if (!targetUrl && !manualText) {
      setError("Inserisci l'indirizzo di una ricetta, oppure incolla il testo o carica un file HTML.");
      return;
    }

    if (!apiKey) {
      setError("Chiave API di Gemini non trovata. Aggiungi VITE_GEMINI_API_KEY nel tuo file .env.local.");
      return;
    }

    setLoading(true);
    setError(null);

    const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemma-4-31b-it";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // Prompt per estrarre la ricetta in formato JSON strutturato
    const promptText = `Sei un esperto assistente culinario. Analizza la ricetta fornita ed estrai tutte le informazioni utili.
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

    let payload = {};

    if (targetUrl && !manualText) {
      // Se c'è solo un URL, sfruttiamo lo strumento nativo google_search di Gemini/Gemma
      // per accedere al link esterno in sicurezza senza errori CORS e analizzare il contenuto reale.
      // NOTA: Non specifichiamo responseMimeType: "application/json" qui perché impedirebbe
      // la chiamata del tool (il modello deve prima emettere una tool call, che non è JSON).
      const queryText = `${promptText}\n\nUsa lo strumento di ricerca Google Search per accedere a questo URL, leggere la ricetta ed estrarre tutti i dettagli in formato JSON strutturato: ${targetUrl}`;
      payload = {
        contents: [
          {
            parts: [
              { text: queryText }
            ]
          }
        ],
        tools: [
          {
            google_search: {}
          }
        ]
      };
    } else {
      // Se l'utente ha caricato un file o incollato il testo manualmente, possiamo forzare il formato JSON
      const truncatedHtml = manualText.substring(0, 120000);
      payload = {
        contents: [
          {
            parts: [
              { text: promptText },
              { text: `Ecco il contenuto del testo/HTML da analizzare per estrarre la ricetta:\n\n${truncatedHtml}` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };
    }

    try {
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        let errorMsg = `Errore API Gemini (${response.status})`;
        try {
          const parsedErr = JSON.parse(errText);
          if (parsedErr.error?.message) {
            errorMsg = parsedErr.error.message;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const resData = await response.json();
      const parts = resData.candidates?.[0]?.content?.parts || [];
      const textResponse = parts
        .filter(part => part.text)
        .map(part => part.text)
        .join("\n");
      
      if (!textResponse) {
        throw new Error("Il modello non ha restituito una risposta valida per questa ricetta. Questo potrebbe accadere se il modello non è riuscito ad accedere alla pagina o se ha esaurito la quota.");
      }

      const ocrData = normalizeRecipeJson(extractRecipeJson(textResponse));
      
      if (targetUrl) {
        ocrData.sourceUrl = targetUrl;
      }

      // Apri nell'editor precompilato
      onSave(
        ocrData.title || "",
        [],
        ocrData,
        ocrData.emoji || "🍝",
        ocrData.color || "#C4593A",
        "altro"
      );
    } catch (err) {
      console.error("Gemini Link Parser Error:", err);
      setError(`Errore: ${err.message || "Impossibile accedere o estrarre i dati"}. Prova ad incollare il testo manualmente o carica il file HTML.`);
    } finally {
      setLoading(false);
    }
  };

  const cssAnimations = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
  `;

  return (
    <div style={{ background: th.appBg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <style dangerouslySetInnerHTML={{ __html: cssAnimations }} />

      {/* Header */}
      <div style={{ padding: "12px 18px 6px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <BackBtn onBack={onBack} label="Annulla" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.display, fontSize: 17, color: th.appInk }}>Importa da Link</div>
          <div style={{ fontFamily: F.ui, fontSize: 10.5, color: th.appFaded }}>Estrai ricetta da URL con AI</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        
        {/* Info Box */}
        <div style={{
          background: th.appCard,
          border: `1.5px solid ${th.appBorder}`,
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start"
        }}>
          <span style={{ fontSize: 24 }}>🔗</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: th.appInk }}>
              Importa ricette da internet
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 11.5, color: th.appFaded, lineHeight: 1.45 }}>
              Inserisci il link di una ricetta trovata su internet e la ricetta verrà aggiunta al tuo ricettario.
            </div>
          </div>
        </div>

        {/* Warning if API key is missing */}
        {!apiKey && (
          <div style={{
            background: "#FDF2F2",
            border: "1.5px solid #F8D7DA",
            borderRadius: 14,
            padding: "12px 16px",
            display: "flex",
            gap: 10,
            alignItems: "center"
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "#721C24", lineHeight: 1.4 }}>
              <b>Chiave API Gemini mancante!</b> Per utilizzare questa funzione, aggiungi la variabile <code>VITE_GEMINI_API_KEY</code> nel file <code>.env.local</code>.
            </div>
          </div>
        )}

        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Input URL */}
            <div>
              <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: th.appInk, display: "block", marginBottom: 6 }}>
                Incolla l'indirizzo (URL) della ricetta
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setError(null);
                }}
                placeholder="es. https://ricette.giallozafferano.it/..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  border: `1.5px solid ${th.appBorder}`,
                  background: th.appCard,
                  fontFamily: F.ui,
                  fontSize: 13,
                  color: th.appInk,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAnalyze}
              disabled={!urlInput.trim() || !apiKey}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: (urlInput.trim() && apiKey) ? th.appAccent : th.appBorder,
                color: "#fff",
                fontFamily: F.ui,
                fontSize: 13,
                fontWeight: 700,
                cursor: (urlInput.trim() && apiKey) ? "pointer" : "default",
                boxShadow: (urlInput.trim() && apiKey) ? `0 4px 12px rgba(196,89,58,0.25)` : "none",
                marginTop: 4
              }}
            >
              Estrai Ricetta 🍳
            </button>

            {/* Alternativa Manuale Toggle */}
            <button
              onClick={() => setShowManualPaste(!showManualPaste)}
              style={{
                background: "transparent",
                border: "none",
                color: th.appFaded,
                fontFamily: F.ui,
                fontSize: 12,
                cursor: "pointer",
                textAlign: "center",
                textDecoration: "underline",
                marginTop: 10
              }}
            >
              {showManualPaste ? "Nascondi opzioni avanzate" : "Mostra opzioni avanzate (copia/incolla o file HTML)"}
            </button>

            {/* Alternativa Manuale Area */}
            {showManualPaste && (
              <div style={{
                borderTop: `1px dashed ${th.appBorder}`,
                paddingTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 14
              }}>
                {/* HTML File Upload */}
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: th.appInk, display: "block", marginBottom: 6 }}>
                    Metodo Alternativo 1: Carica file HTML locale (Ctrl+S)
                  </label>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    border: `1.5px dashed ${th.appBorder}`,
                    borderRadius: 10,
                    background: th.appCard,
                    padding: "12px",
                    cursor: "pointer",
                    textAlign: "center"
                  }}>
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <span style={{ fontSize: 18 }}>📂</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: fileName ? th.appInk : th.appFaded, fontWeight: fileName ? 600 : 400 }}>
                      {fileName ? `File: ${fileName}` : "Scegli file HTML"}
                    </span>
                  </label>
                </div>

                {/* Textarea Paste */}
                <div>
                  <label style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: th.appInk, display: "block", marginBottom: 6 }}>
                    Metodo Alternativo 2: Incolla testo ricetta o codice HTML
                  </label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => {
                      setHtmlContent(e.target.value);
                      if (fileName) setFileName("");
                    }}
                    placeholder="Incolla il testo copiato dal sito..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 10,
                      border: `1.5px solid ${th.appBorder}`,
                      background: th.appCard,
                      fontFamily: F.ui,
                      fontSize: 12,
                      color: th.appInk,
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                      lineHeight: 1.4
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "40px 20px"
          }}>
            <div style={{
              width: 50,
              height: 50,
              border: `5px solid ${th.appBorder}`,
              borderTop: `5px solid ${th.appAccent}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <div style={{
              fontFamily: F.ui,
              fontSize: 14,
              fontWeight: 700,
              color: th.appInk,
              textAlign: "center",
              animation: "pulse 1.8s ease-in-out infinite"
            }}>
              Scaricamento ed estrazione in corso...
            </div>
            <div style={{
              fontFamily: F.ui,
              fontSize: 11,
              color: th.appFaded,
              textAlign: "center",
              maxWidth: 240,
              lineHeight: 1.4
            }}>
              Estrazione di titolo, ingredienti, dosi e passaggi.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: "#FFF5F5",
            border: "1.5px solid #FEB2B2",
            borderRadius: 14,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>❌</span>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#C53030" }}>
                Errore di importazione
              </div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "#9B2C2C", lineHeight: 1.5 }}>
              {error}
            </div>
            <button
              onClick={handleAnalyze}
              style={{
                alignSelf: "flex-end",
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "#C53030",
                color: "#fff",
                fontFamily: F.ui,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Riprova
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
