import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import EditLabel from "./EditLabel.jsx";

// Negli stili nuovi un solo stile di campo per tutta l'app: nessuna
// etichetta sopra, solo il testo di esempio dentro (DECISIONI.md §Nuova
// ricetta / IMPLEMENTATION_PLAN Fase 8). In classico resta come prima.
const FOCUS_CSS = ".field-new:focus { border-color: var(--field-focus) !important; }";

export default function EditField({ label, value, onChange, placeholder="" }) {
  const th = useTheme();
  const ui = useUiStyle();

  if (ui.id === "classico") {
    return (
      <div>
        <EditLabel text={label}/>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
          width:"100%", padding:"10px 14px",
          border:`1.5px solid #EDE6D4`, borderRadius:10,
          background:"#F7F2E8", fontFamily:F.body, fontSize:14, color:"#2C2416",
          outline:"none", boxSizing:"border-box",
        }}/>
      </div>
    );
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_CSS }} />
      <input
        className="field-new"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || label}
        style={{
          "--field-focus": th.appAccent,
          width:"100%", padding:"11px 14px",
          border:`1px solid ${th.appBorder}`, borderRadius:11,
          background:th.appCard, fontFamily:F.body, fontSize:14, color:th.appInk,
          outline:"none", boxSizing:"border-box",
        }}
      />
    </div>
  );
}
