import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

export default function BackBtn({ onBack, label="Indietro", dark=false }) {
  const th = useTheme();
  return (
    <button onClick={onBack} style={{
      background:"none", border:"none", cursor:"pointer",
      // `dark` = vista libro (facsimile di carta, esente dal restyling):
      // bookFaded resta fisso. Altrimenti l'accento della palette scelta,
      // non più un arancione scritto a mano (era sempre lo stesso colore
      // in ogni palette, indipendentemente dal tema).
      color: dark ? th.bookFaded : th.appAccent,
      fontFamily:F.ui, fontSize:15,
      display:"flex", alignItems:"center", gap:4, padding:"4px 0",
    }}>‹ {label}</button>
  );
}
