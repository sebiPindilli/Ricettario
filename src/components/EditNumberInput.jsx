import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";

export default function EditNumberInput({ value, onChange }) {
  const th = useTheme();
  const ui = useUiStyle();

  if (ui.id === "classico") {
    return (
      <input type="number" value={value} onChange={e => onChange(e.target.value)} style={{
        width:"100%", padding:"10px 10px",
        border:`1.5px solid #EDE6D4`, borderRadius:10,
        background:"#F7F2E8", fontFamily:F.ui, fontSize:14, color:"#2C2416",
        outline:"none", boxSizing:"border-box", textAlign:"center",
      }}/>
    );
  }

  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)} style={{
      width:"100%", padding:"11px 10px",
      border:`1px solid ${th.appBorder}`, borderRadius:11,
      background:th.appCard, fontFamily:F.ui, fontSize:14, color:th.appInk,
      outline:"none", boxSizing:"border-box", textAlign:"center",
    }}/>
  );
}
