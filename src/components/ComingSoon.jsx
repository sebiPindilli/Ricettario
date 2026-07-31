import React from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import BackBtn from "./BackBtn.jsx";

// ══════════════════════════════════════════════════════════════
// SEGNAPOSTO CONDIVISO — "funzione in arrivo", usato da tutte le
// modalità di aggiunta ricetta non ancora costruite (scansione, link…)
// ══════════════════════════════════════════════════════════════
export default function ComingSoon({ icon = "✨", title, message, onBack, backLabel = "Annulla" }) {
  const th = useTheme();
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"8px 20px 0" }}>
        <BackBtn onBack={onBack} label={backLabel}/>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 28px", gap:14, textAlign:"center" }}>
        <div style={{ fontSize:52 }}>{icon}</div>
        <div style={{ fontFamily:F.display, fontSize:22, color:th.appInk, fontStyle:"italic" }}>{title}</div>
        <div style={{ fontFamily:F.ui, fontSize:13, color:th.appFaded, lineHeight:1.6, maxWidth:280 }}>{message}</div>
      </div>
    </div>
  );
}
