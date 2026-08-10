import { useScanExtraction } from "../context.js";
import { F } from "../data/constants.js";

// ── Banner globale di completamento dell'estrazione AI — visibile solo
// quando l'utente NON è già sullo screen che l'ha avviata (quello screen
// mostra l'esito inline con la sua stessa UI, il banner qui duplicherebbe
// l'informazione). Montato in TopStack.jsx come terzo elemento dello stack
// condiviso (banner offline, barra timer, questo).
export default function ScanStatusBanner({ isOnExtractionScreen, onOpenResult, onOpenScreen }) {
  const { job, dismissJob } = useScanExtraction();

  if (!job || job.status === "running" || isOnExtractionScreen) return null;

  const isDone = job.status === "done";
  const title = job.result?.title?.trim();
  const label = isDone
    ? `🍳 "${title && title !== "?" ? title : "Ricetta"}" è pronta — tocca per rivedere`
    : "⚠️ Estrazione non riuscita — tocca per i dettagli";

  const handleTap = () => {
    if (isDone) { onOpenResult(job.result); dismissJob(); }
    else onOpenScreen(job.kind);
  };

  return (
    <div style={{ display:"flex", alignItems:"stretch", background: isDone ? "#4A7A6B" : "#C0524A", color:"#fff", height:30 }}>
      <button onClick={handleTap} style={{
        flex:1, minWidth:0, border:"none", background:"none", color:"#fff",
        fontFamily:F.ui, fontSize:11, fontWeight:600, textAlign:"left",
        padding:"0 12px", cursor:"pointer",
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
      }}>{label}</button>
      <button onClick={dismissJob} title="Chiudi" style={{
        flexShrink:0, background:"rgba(0,0,0,0.15)", border:"none",
        padding:"0 12px", color:"#fff", fontSize:13, cursor:"pointer",
      }}>✕</button>
    </div>
  );
}
