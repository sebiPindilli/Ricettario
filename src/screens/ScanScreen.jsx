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

export default function ScanScreen({ onBack, onSave }) {
  const th = useTheme();
  const [images, setImages] = useState([]); // array di { id, base64, mimeType, previewUrl }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result.split(",")[1];
          resolve({
            id: Date.now() + Math.random().toString(36).substring(2, 9),
            base64: base64Data,
            mimeType: file.type,
            previewUrl: URL.createObjectURL(file)
          });
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const newImages = await Promise.all(promises);
      setImages(prev => [...prev, ...newImages]);
      setError(null);
    } catch (err) {
      console.error("Error reading files:", err);
      setError("Si è verificato un errore nel caricamento di alcune foto.");
    }
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    if (!apiKey) {
      setError("Chiave API di Gemini non trovata. Aggiungi VITE_GEMINI_API_KEY nel tuo file .env.local.");
      return;
    }

    setLoading(true);
    setError(null);

    // Prompt specifico per estrarre la ricetta in formato JSON strutturato da una o più immagini
    const promptText = `Sei un esperto assistente culinario. Analizza le immagini di questa ricetta (che potrebbero essere più pagine, note scritte a mano o parti diverse) ed estrai tutte le informazioni combinandole in un'unica ricetta.
Restituisci esclusivamente un oggetto JSON ben formato che rispetta esattamente questo schema, senza alcun commento o blocco di codice markdown (NON inserire \`\`\`json all'inizio e \`\`\` alla fine):
{
  "title": "Titolo identificativo della ricetta",
  "prepTime": tempo_preparazione_in_minuti_numero,
  "cookTime": tempo_cottura_in_minuti_numero,
  "servings": porzioni_numero,
  "note": "Eventuali note, consigli, varianti o storie scritte sulla ricetta",
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
- Cerca di ripulire i testi da eventuali errori di lettura OCR mantenendo la ricetta fedele, completa e naturale, unendo le informazioni di tutte le foto inserite.
- Se mancano dettagli come tempi o porzioni, stima un valore ragionevole o inserisci 0.`;

    const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemma-4-31b-it";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const imageParts = images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    }));

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
            ...imageParts
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Errore API Gemini (${response.status}): ${errText}`);
      }

      const resData = await response.json();
      const parts = resData.candidates?.[0]?.content?.parts || [];
      const textResponse = parts
        .filter(part => part.text)
        .map(part => part.text)
        .join("\n");
      
      if (!textResponse) {
        throw new Error("Gemini ha restituito una risposta vuota o non valida.");
      }

      const ocrData = normalizeRecipeJson(extractRecipeJson(textResponse));
      
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
      console.error("Gemini Scan Error:", err);
      setError("Si è verificato un errore durante l'analisi. Riprova con un'immagine più nitida o controlla la tua chiave API.");
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
          <div style={{ fontFamily: F.display, fontSize: 17, color: th.appInk }}>Scansiona Foto</div>
          <div style={{ fontFamily: F.ui, fontSize: 10.5, color: th.appFaded }}>Crea ricetta da foto AI</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Info card */}
        <div style={{
          background: th.appCard,
          border: `1.5px solid ${th.appBorder}`,
          borderRadius: 16,
          padding: "16px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start"
        }}>
          <span style={{ fontSize: 24 }}>📸</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: th.appInk }}>
              Fotografa una ricetta
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, lineHeight: 1.5 }}>
              Carica una foto (anche scritta a mano o pagine di libri) e la ricetta verrà aggiunta al tuo ricettario.
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

        {/* Upload Container */}
        {images.length === 0 && (
          <label style={{
            flex: 1,
            minHeight: 200,
            border: `2px dashed ${th.appBorder}`,
            borderRadius: 20,
            background: th.appCard,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            cursor: "pointer",
            padding: "30px 20px",
            transition: "all 0.2s",
            textAlign: "center"
          }}>
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <span style={{ fontSize: 44 }}>📷</span>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: th.appInk }}>
                Fai una foto o scegli un'immagine
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: th.appFaded, marginTop: 4 }}>
                Supporta JPG, PNG, WEBP (più foto accettate)
              </div>
            </div>
          </label>
        )}

        {/* Image Grid Preview & Action Buttons */}
        {images.length > 0 && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Grid list */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: 12
            }}>
              {images.map((img) => (
                <div key={img.id} style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: `1.5px solid ${th.appBorder}`,
                  background: "#1a1a1a",
                  aspectRatio: "1/1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <img
                    src={img.previewUrl}
                    alt="Anteprima"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    onClick={() => setImages(prev => prev.filter(x => x.id !== img.id))}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "rgba(0, 0, 0, 0.6)",
                      border: "none",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add More Tile */}
              <label style={{
                borderRadius: 12,
                border: `2px dashed ${th.appBorder}`,
                background: th.appCard,
                aspectRatio: "1/1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                cursor: "pointer",
                padding: 8,
                textAlign: "center"
              }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: 24 }}>➕</span>
                <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: th.appInk }}>Aggiungi</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setImages([])}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1.5px solid ${th.appBorder}`,
                  background: "transparent",
                  color: th.appInk,
                  fontFamily: F.ui,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Svuota
              </button>

              <button
                onClick={handleAnalyze}
                disabled={!apiKey}
                style={{
                  flex: 2,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: apiKey ? th.appAccent : th.appBorder,
                  color: "#fff",
                  fontFamily: F.ui,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: apiKey ? "pointer" : "default",
                  boxShadow: apiKey ? `0 4px 12px rgba(196,89,58,0.25)` : "none"
                }}
              >
                Analizza Foto ({images.length}) 🍳
              </button>
            </div>
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
              Estrazione della ricetta in corso...
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
                Si è verificato un errore
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
