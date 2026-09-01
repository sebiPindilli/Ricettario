import { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";

// Popup "Cambia ricettario" — solo lista, niente scheda completa (rinomina/
// backup/membri/elimina restano dentro "I miei ricettari"). Stesso
// linguaggio visivo degli altri overlay centrati della sessione
// (PhotoCropOverlay.jsx/SectionMovePicker.jsx).
export default function SwitchBookOverlay({ books, activeBookId, onSwitch, onClose }) {
  const th = useTheme();
  const ui = useUiStyle();
  const [switching, setSwitching] = useState(null); // bookId in corso

  // I backup non sono ricettari su cui "entrare" normalmente — restano
  // gestibili solo da "I miei ricettari".
  const pickable = books.filter(b => !b.isBackup);

  const pick = async (id) => {
    if (id === activeBookId || switching) return;
    setSwitching(id);
    try {
      await onSwitch(id);
      onClose();
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxHeight:"80%", overflowY:"auto", background:th.appBg, borderRadius:20, padding:"18px 16px", boxShadow:"0 10px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, textAlign:"center", marginBottom:12 }}>Cambia ricettario</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
          {pickable.map(b => {
            const active = b.id === activeBookId;
            return (
              <button key={b.id} disabled={active || !!switching} onClick={() => pick(b.id)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"11px 14px", borderRadius:12, textAlign:"left",
                border:`1.5px solid ${active ? th.appAccent : ui.border}`,
                background: active ? th.appPillBg : ui.card,
                cursor: active ? "default" : (switching ? "default" : "pointer"),
              }}>
                <span style={{ flex:1, minWidth:0, fontFamily:F.body, fontSize:14, color:th.appInk, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</span>
                {active ? (
                  <span style={{ flexShrink:0, fontFamily:F.ui, fontSize:9, fontWeight:700, letterSpacing:0.5, color:th.appOnAccent, background:th.appAccent, borderRadius:6, padding:"2px 6px", textTransform:"uppercase" }}>Attivo</span>
                ) : switching === b.id ? (
                  <span style={{ flexShrink:0, fontFamily:F.ui, fontSize:11, color:th.appFaded }}>Apertura…</span>
                ) : (
                  <span style={{ flexShrink:0, color:th.appFaded, fontSize:16 }}>›</span>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{ width:"100%", padding:"11px", border:`1.5px solid ${ui.border}`, borderRadius:12, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Chiudi</button>
      </div>
    </div>
  );
}
