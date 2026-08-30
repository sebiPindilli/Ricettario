import React, { useState, useEffect } from "react";
import { useTheme, useScanExtraction } from "../context.js";
import { F } from "../data/constants.js";
import BackBtn from "../components/BackBtn.jsx";
import InfoButton from "../components/InfoButton.jsx";
import AppIcon from "../components/AppIcon.jsx";
import { guideLink } from "../data/guideContent.jsx";

export default function AddFromLinkScreen({ onBack, onSave }) {
  const th = useTheme();
  const [urlInput, setUrlInput] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [validationError, setValidationError] = useState(null);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const { job, startExtraction, retryExtraction, dismissJob } = useScanExtraction();

  // Solo il proprio job: se un'estrazione di un ALTRO tipo (foto) è in corso
  // o è appena fallita, questo screen non deve appropriarsene — vedi
  // ScanStatusBanner per il caso "l'utente è altrove".
  const mineRunning = job?.status === "running" && job.kind === "link";
  const otherRunning = job?.status === "running" && job.kind !== "link";
  const jobError = job?.status === "error" && job.kind === "link" ? job.errorMessage : null;
  const displayError = validationError || jobError;

  // Se l'estrazione finisce mentre si è rimasti su questo screen, va dritto
  // nell'editor come sempre — se invece l'utente ha navigato altrove nel
  // frattempo, questo screen è smontato e non può farlo: se ne occupa il
  // banner globale (ScanStatusBanner).
  useEffect(() => {
    if (job?.status === "done" && job.kind === "link") {
      onSave(job.result.title, [], job.result.ocrData, job.result.emoji, job.result.color, "altro");
      dismissJob();
    }
  }, [job, onSave, dismissJob]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setHtmlContent(event.target.result);
      setValidationError(null);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = () => {
    const targetUrl = urlInput.trim();
    const manualText = htmlContent.trim();

    if (!targetUrl && !manualText) {
      setValidationError("Inserisci l'indirizzo di una ricetta, oppure incolla il testo o carica un file HTML.");
      return;
    }
    setValidationError(null);
    startExtraction("link", { url: targetUrl, text: manualText });
  };

  // Se si esce dopo aver già visto l'esito (non mentre è ancora in corso —
  // quella prosegue in background), non lasciare un job terminato in giro:
  // altrimenti il banner globale ripeterebbe un'informazione già vista qui.
  const handleBack = () => {
    if (job && job.status !== "running" && job.kind === "link") dismissJob();
    onBack();
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
        <BackBtn onBack={handleBack} label="Annulla" />
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
          <span style={{ fontSize: 24, display: "flex" }}><AppIcon emoji="🔗" icon="link" size={24} /></span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: th.appInk }}>
              Importa ricette da internet
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 11.5, color: th.appFaded, lineHeight: 1.45 }}>
              Inserisci il link di una ricetta trovata su internet e la ricetta verrà aggiunta al tuo ricettario.
            </div>
          </div>
        </div>

        {!mineRunning && (() => {
          // Il bottone deve attivarsi se l'utente ha valorizzato ALMENO UNO
          // dei due input (URL, oppure testo/HTML incollato o caricato da
          // file — questi due condividono lo stesso state htmlContent):
          // handleAnalyze gestisce già entrambi i casi separatamente.
          const canSubmit = (urlInput.trim() || htmlContent.trim()) && !otherRunning;
          return (
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
                  setValidationError(null);
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
              disabled={!canSubmit}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: canSubmit ? th.appAccent : th.appBorder,
                color: "#fff",
                fontFamily: F.ui,
                fontSize: 13,
                fontWeight: 700,
                cursor: canSubmit ? "pointer" : "default",
                boxShadow: canSubmit ? `0 4px 12px rgba(196,89,58,0.25)` : "none",
                marginTop: 4
              }}
            >
              Estrai Ricetta 🍳
            </button>

            {otherRunning && (
              <div style={{ fontFamily: F.ui, fontSize: 11.5, color: th.appFaded, textAlign: "center" }}>
                ⏳ Un'altra estrazione è già in corso — attendi il completamento prima di avviarne un'altra.
              </div>
            )}

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
          );
        })()}

        {/* Loading State */}
        {mineRunning && (
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
            <button
              onClick={onBack}
              style={{
                marginTop: 8,
                padding: "10px 20px",
                borderRadius: 12,
                border: `1.5px solid ${th.appBorder}`,
                background: "transparent",
                color: th.appInk,
                fontFamily: F.ui,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              ✅ Continua a usare l'app
            </button>
            <div style={{ fontFamily: F.ui, fontSize: 10.5, color: th.appFaded, textAlign: "center", maxWidth: 240 }}>
              L'estrazione prosegue in background — ti avviseremo con un banner quando è pronta.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {displayError && (
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
              {displayError}
            </div>
            <button
              onClick={jobError ? retryExtraction : handleAnalyze}
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
