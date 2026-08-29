import { useUiStyle } from "../context.js";
import { F } from "../data/constants.js";

const FOCUS_CSS = ".number-field-new:focus { border-color: var(--field-focus) !important; }";

export default function EditNumberInput({ value, onChange }) {
  const ui = useUiStyle();

  if (ui.fields !== "placeholder") {
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
    <>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_CSS }} />
      <input
        className="number-field-new"
        type="number" value={value} onChange={e => onChange(e.target.value)}
        style={{
          "--field-focus": ui.accent,
          width:"100%", padding:"11px 13px",
          border:`1px solid ${ui.border}`, borderRadius:ui.radius.control,
          background:ui.card, fontFamily:F.display, fontSize:15, color:ui.ink,
          outline:"none", boxSizing:"border-box", textAlign:"center",
        }}
      />
    </>
  );
}
