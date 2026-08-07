import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

// ══════════════════════════════════════════════════════════════
// COMPONENT: InfoButton — cerchietto "i" che apre un overlay
// centrato con il testo guida, per schermate/popup senza
// GlobalNav (che ha già il proprio meccanismo di tendina a piena
// larghezza). Un popover ancorato al bottone rischiava di uscire
// dallo schermo quando il pulsante è vicino a un bordo — un
// overlay centrato, come già usato da ServingsDialog/ShoppingMode/
// ExportFlow, è la soluzione robusta indipendentemente da dove
// il pulsante viene inserito.
// ══════════════════════════════════════════════════════════════
export default function InfoButton({ children, dark = false, size = 22, triggerStyle = null }) {
  const th = useTheme();
  const [open, setOpen] = useState(false);
  const faded = dark ? "rgba(255,255,255,0.7)" : th.appFaded;
  const border = dark ? "rgba(255,255,255,0.35)" : th.appBorder;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Informazioni"
        style={{
          width:size, height:size, borderRadius:"50%", padding:0, flexShrink:0,
          border:`1.5px solid ${border}`,
          background: dark ? "rgba(255,255,255,0.12)" : th.appCard,
          color:faded,
          fontFamily:F.ui, fontSize:size*0.55, fontWeight:700, fontStyle:"italic",
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
          lineHeight:1,
          ...triggerStyle,
        }}
      >i</button>

      {open && (
        <div onClick={() => setOpen(false)} style={{
          position:"absolute", inset:0, zIndex:900,
          background:"rgba(0,0,0,0.55)", backdropFilter:"blur(3px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"100%", maxHeight:"78%", overflowY:"auto",
            background:th.appBg, borderRadius:18, padding:"16px 18px 18px",
            boxShadow:"0 14px 40px rgba(0,0,0,0.35)",
            fontFamily:F.body, fontSize:12.5, lineHeight:1.65, color:th.appInk,
          }}>
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:2 }}>
              <button onClick={() => setOpen(false)} style={{
                background:"none", border:"none", color:th.appFaded,
                fontSize:18, cursor:"pointer", padding:2, lineHeight:1,
              }}>✕</button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
