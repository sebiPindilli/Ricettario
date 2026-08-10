import { useState, useCallback } from "react";
import { ScanExtractionCtx } from "../context.js";
import { uid } from "../utils/helpers.js";
import { auth } from "../firebase.js";

// Esegue la chiamata effettiva a Gemini per un job — stessa identica logica
// che prima viveva dentro handleAnalyze di AddFromLinkScreen.jsx/ScanScreen.jsx,
// spostata qui perché deve proseguire anche se lo screen che l'ha avviata si
// smonta (l'utente naviga altrove). Ritorna { result } oppure lancia con un
// messaggio già pronto per l'utente.
async function runExtraction(kind, params) {
  const idToken = await auth.currentUser.getIdToken();

  if (kind === "link") {
    const response = await fetch("/api/parse-recipe-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        params.url && !params.text ? { idToken, url: params.url } : { idToken, text: params.text }
      ),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Errore (${response.status})`);
    const ocrData = data.recipe;
    if (params.url) ocrData.sourceUrl = params.url;
    return { title: ocrData.title || "", ocrData, emoji: ocrData.emoji || "🍝", color: ocrData.color || "#C4593A" };
  }

  // kind === "photo"
  const response = await fetch("/api/parse-recipe-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      images: params.images.map(img => ({ base64: img.base64, mimeType: img.mimeType })),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Errore (${response.status})`);
  const ocrData = data.recipe;
  return { title: ocrData.title || "", ocrData, emoji: ocrData.emoji || "🍝", color: ocrData.color || "#C4593A" };
}

const errorMessageFor = (kind, err) => kind === "link"
  ? `Errore: ${err.message || "Impossibile accedere o estrarre i dati"}. Prova ad incollare il testo manualmente o carica il file HTML.`
  : `Si è verificato un errore durante l'analisi (${err.message || "errore sconosciuto"}). Riprova con un'immagine più nitida.`;

// ── Provider dell'estrazione AI in background — un solo job alla volta a
// livello di app (non un array): se l'utente prova ad avviarne una seconda
// mentre una è in corso, startExtraction è un no-op (i chiamanti disabilitano
// comunque il loro bottone). Montato sopra lo switch di `screen`, stesso
// posto di CookingTimersProvider — sopravvive alla navigazione.
export default function ScanExtractionProvider({ children }) {
  const [job, setJob] = useState(null);

  // Avvia la chiamata e ritorna subito il job "running" — non aspetta la
  // Promise: startExtraction/retryExtraction devono restituire il controllo
  // immediatamente perché lo screen chiamante possa mostrare lo spinner.
  const launch = useCallback((kind, params) => {
    const id = uid("scan");
    runExtraction(kind, params).then(
      (result) => setJob(cur => cur?.id === id ? { ...cur, status: "done", result } : cur),
      (err) => setJob(cur => cur?.id === id ? { ...cur, status: "error", errorMessage: errorMessageFor(kind, err) } : cur)
    );
    return { id, kind, params, status: "running", result: null, errorMessage: null, startedAt: Date.now() };
  }, []);

  const startExtraction = useCallback((kind, params) => {
    setJob(prev => prev?.status === "running" ? prev : launch(kind, params));
  }, [launch]);

  const retryExtraction = useCallback(() => {
    setJob(prev => (!prev || prev.status === "running") ? prev : launch(prev.kind, prev.params));
  }, [launch]);

  const dismissJob = useCallback(() => setJob(null), []);

  const value = { job, startExtraction, retryExtraction, dismissJob };
  return <ScanExtractionCtx.Provider value={value}>{children}</ScanExtractionCtx.Provider>;
}
