import { F } from "../data/constants.js";

export default function BackBtn({ onBack, label="Indietro", dark=false }) {
  return (
    <button onClick={onBack} style={{
      background:"none", border:"none", cursor:"pointer",
      color: dark ? "#555" : "#C4593A",
      fontFamily:F.ui, fontSize:15,
      display:"flex", alignItems:"center", gap:4, padding:"4px 0",
    }}>‹ {label}</button>
  );
}
