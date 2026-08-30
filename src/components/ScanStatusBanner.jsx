import { useScanExtraction } from "../context.js";
import { F } from "../data/constants.js";
import AppIcon from "./AppIcon.jsx";

// ── Banner globale di stato dell'estrazione AI — visibile solo quando
// l'utente NON è già sullo screen che l'ha avviata (quello screen mostra
// l'esito/il progresso inline con la sua stessa UI, il banner qui
// duplicherebbe l'informazione). Montato in TopStack.jsx come terzo
// elemento dello stack condiviso (banner offline, barra timer, questo).
// Tre stati: in corso (non cliccabile, il risultato non c'è ancora),
// pronta (tocca per rivedere), fallita (tocca per i dettagli).
export default function ScanStatusBanner({ isOnExtractionScreen, onOpenResult, onOpenScreen }) {
  const { job, dismissJob } = useScanExtraction();

  if (!job || isOnExtractionScreen) return null;

  const isRunning = job.status === "running";
  const isDone = job.status === "done";
  const title = job.result?.title?.trim();
  const label = isRunning
    ? "🍳 Estrazione ricetta in corso…"
    : isDone
    ? `🍳 "${title && title !== "?" ? title : "Ricetta"}" è pronta — tocca per rivedere`
    : "Estrazione non riuscita — tocca per i dettagli";
  const isFailed = !isRunning && !isDone;

  const handleTap = () => {
    if (isRunning) return;
    if (isDone) { onOpenResult(job.result); dismissJob(); }
    else onOpenScreen(job.kind);
  };

  return (
    <div style={{ display:"flex", alignItems:"stretch", background: isRunning ? "#6B6355" : isDone ? "#4A7A6B" : "#C0524A", color:"#fff", height:30 }}>
      <button onClick={handleTap} disabled={isRunning} style={{
        flex:1, minWidth:0, border:"none", background:"none", color:"#fff",
        fontFamily:F.ui, fontSize:11, fontWeight:600, textAlign:"left",
        padding:"0 12px", cursor: isRunning ? "default" : "pointer",
        display:"flex", alignItems:"center", gap:6,
      }}>
        {isFailed && <AppIcon emoji="⚠️" icon="avviso" size={12} />}
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
      </button>
      {!isRunning && (
        <button onClick={dismissJob} title="Chiudi" style={{
          flexShrink:0, background:"rgba(0,0,0,0.15)", border:"none",
          padding:"0 12px", color:"#fff", fontSize:13, cursor:"pointer",
        }}>✕</button>
      )}
    </div>
  );
}
