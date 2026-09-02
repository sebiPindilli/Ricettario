import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

export default function BackBtn({ onBack, label="Indietro" }) {
  const th = useTheme();
  return (
    <button onClick={onBack} style={{
      background:"none", border:"none", cursor:"pointer",
      // Accento della palette scelta, non più un arancione scritto a mano
      // (era sempre lo stesso colore in ogni palette, indipendentemente dal tema).
      color: th.appAccent,
      fontFamily:F.ui, fontSize:15,
      display:"flex", alignItems:"center", gap:4, padding:"4px 0",
    }}>‹ {label}</button>
  );
}
