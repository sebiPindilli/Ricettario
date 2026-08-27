import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import AppIcon from "./AppIcon.jsx";

const SIZE = 22;

// ══════════════════════════════════════════════════════════════
// COMPONENT: InfoButton — cerchietto "i" uniforme in tutta l'app,
// apre sempre un overlay centrato. `dark` riguarda SOLO il
// cerchietto (per restare leggibile su sfondi neri come Cucina/
// Modalità Spesa) — il popup che si apre ha sempre lo stesso
// aspetto (sfondo, font, testo), indipendentemente da dove viene
// aperto: è quello il punto, non ha senso che il contenuto cambi
// veste a seconda del contesto che lo ospita.
// ══════════════════════════════════════════════════════════════
export default function InfoButton({ children, dark = false, triggerStyle = null }) {
  const th = useTheme();
  const [open, setOpen] = useState(false);
  const triggerFaded = dark ? "rgba(255,255,255,0.7)" : th.appFaded;
  const triggerBorder = dark ? "rgba(255,255,255,0.35)" : th.appBorder;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Informazioni"
        style={{
          width:SIZE, height:SIZE, borderRadius:"50%", padding:0, flexShrink:0,
          border:`1.5px solid ${triggerBorder}`,
          background: dark ? "rgba(255,255,255,0.12)" : th.appCard,
          color:triggerFaded,
          fontFamily:F.ui, fontWeight:700, fontStyle:"italic",
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
          lineHeight:1,
          ...triggerStyle,
        }}
      ><AppIcon emoji="i" icon="info" size={SIZE*0.55} /></button>

      {open && (
        <div onClick={() => setOpen(false)} style={{
          // fixed, non absolute: l'InfoButton finisce dentro contenitori
          // diversi (barre sticky, schermate a piena altezza, popup già
          // aperti...) e non possiamo contare sul fatto che il più vicino
          // antenato posizionato copra tutto lo schermo. fixed si ancora
          // sempre a .iphone-shell (che ha transform, vedi ricettario-v23.jsx),
          // indipendentemente da dove il pulsante viene montato.
          position:"fixed", inset:0, zIndex:900,
          background:"rgba(0,0,0,0.55)", backdropFilter:"blur(3px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"100%", maxHeight:"78%", overflowY:"auto",
            background:th.appCard,
            border:`1px solid ${th.appBorder}`,
            borderRadius:14, padding:"12px 14px",
            boxShadow:"0 10px 30px rgba(0,0,0,0.3)",
            fontFamily:F.body, fontSize:12.5, lineHeight:1.65, color:th.appInk,
          }}>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
