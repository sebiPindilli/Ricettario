import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

export default function SectionBadge({ label, color }) {
  const th = useTheme();
  if (!label) return null;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8,
      margin:"14px 0 6px",
    }}>
      <div style={{
        background: color || th.appAccent,
        color:"#fff",
        fontFamily:F.ui, fontSize:10, fontWeight:700,
        letterSpacing:1.5, textTransform:"uppercase",
        padding:"3px 10px", borderRadius:20,
      }}>{label}</div>
      <div style={{ flex:1, height:1, background:th.appBorder }}/>
    </div>
  );
}
