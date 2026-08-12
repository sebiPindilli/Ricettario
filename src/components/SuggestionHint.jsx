import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

// Tendina per suggerimenti che reindirizzano a Organizza Ingredienti (aggregati,
// categorie, equivalenze, nutrizione...). Aperta di default, l'utente può nasconderla.
export default function SuggestionHint({ children, onClick = null }) {
  const th = useTheme();
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <div
        onClick={() => setOpen(true)}
        style={{
          marginBottom:14, padding:"5px 12px", display:"inline-flex", alignItems:"center", gap:6,
          background:`${th.appAccent}10`, border:`1px dashed ${th.appAccent}55`, borderRadius:10, cursor:"pointer",
        }}
      >
        <span style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded }}>💡 Suggerimento nascosto</span>
        <span style={{ color:th.appAccent, fontSize:11 }}>▾</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick || undefined}
      style={{
        marginBottom:14, padding:"9px 12px", display:"flex", alignItems:"flex-start", gap:8,
        background:`${th.appAccent}10`, border:`1px dashed ${th.appAccent}55`, borderRadius:10,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ flex:1, minWidth:0 }}>{children}</div>
      <button
        onClick={e => { e.stopPropagation(); setOpen(false); }}
        title="Nascondi suggerimento"
        style={{ flexShrink:0, background:"none", border:"none", color:th.appFaded, cursor:"pointer", fontSize:13, lineHeight:1, padding:2 }}
      >✕</button>
    </div>
  );
}
