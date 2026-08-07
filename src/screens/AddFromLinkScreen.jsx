import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { auth } from "../firebase.js";
import BackBtn from "../components/BackBtn.jsx";
import InfoButton from "../components/InfoButton.jsx";
import { guideLink } from "../data/guideContent.jsx";

export default function AddFromLinkScreen({ onBack, onSave }) {
  const th = useTheme();
  const [urlInput, setUrlInput] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualPaste, setShowManualPaste] = useState(false);

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

    setLoading(true);
    setError(null);

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/parse-recipe-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          targetUrl && !manualText ? { idToken, url: targetUrl } : { idToken, text: manualText }
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Errore (${response.status})`);
      }

      const ocrData = data.recipe;
      if (targetUrl) ocrData.sourceUrl = targetUrl;

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
      console.error("Errore analisi ricetta da link:", err);
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
        <InfoButton>{guideLink}</InfoButton>
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
              disabled={!urlInput.trim()}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: urlInput.trim() ? th.appAccent : th.appBorder,
                color: "#fff",
                fontFamily: F.ui,
                fontSize: 13,
                fontWeight: 700,
                cursor: urlInput.trim() ? "pointer" : "default",
                boxShadow: urlInput.trim() ? `0 4px 12px rgba(196,89,58,0.25)` : "none",
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
