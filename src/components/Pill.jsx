import { F } from "../data/constants.js";

export default function Pill({ icon, label }) {
  return (
    <span style={{
      background:"rgba(255,255,255,0.25)", borderRadius:20, padding:"5px 10px",
      fontFamily:F.ui, fontSize:11, color:"#fff",
      display:"flex", alignItems:"center", gap:4,
    }}>{icon} {label}</span>
  );
}
