import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

// ══════════════════════════════════════════════════════════════
// GUIDA IN-APP — stessa struttura del manuale utente
// ══════════════════════════════════════════════════════════════
export default function GuideScreen({ onBack }) {
  const th = useTheme();
  const [open, setOpen] = useState("idea"); // capitolo espanso (il primo, all'apertura)

  const Chapter = ({ id, icon, title, children }) => {
    const isOpen = open === id;
    return (
      <div style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:13, marginBottom:8, overflow:"hidden" }}>
        <button onClick={() => setOpen(isOpen ? null : id)} style={{
          width:"100%", display:"flex", alignItems:"center", gap:10, padding:"13px 14px",
          background:"none", border:"none", cursor:"pointer", textAlign:"left",
        }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ flex:1, fontFamily:F.ui, fontSize:13, fontWeight:700, color:th.appInk }}>
            {title}
          </span>
          <span style={{ color:th.appFaded, fontSize:12 }}>{isOpen ? "▴" : "▾"}</span>
        </button>
        {isOpen && (
          <div style={{ padding:"0 15px 15px", fontFamily:F.body, fontSize:12.5, color:th.appInk, lineHeight:1.65 }}>
            {children}
          </div>
        )}
      </div>
    );
  };
  const Key = ({ children }) => (
    <div style={{ background:"#faf5e6", borderLeft:"3px solid #b8973a", borderRadius:7, padding:"9px 11px", margin:"10px 0", fontSize:11.5, color:"#6f5c25", lineHeight:1.55 }}>{children}</div>
  );
  const Tip = ({ children }) => (
    <div style={{ background:"#eef3ee", borderLeft:"3px solid #6b8c6e", borderRadius:7, padding:"9px 11px", margin:"10px 0", fontSize:11.5, color:"#41603f", lineHeight:1.55 }}>{children}</div>
  );

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"12px 18px 6px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.display, fontSize:17, color:th.appInk }}>Guida</div>
          <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded }}>come funziona l'app</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"8px 16px 36px" }}>

        <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.1, color:th.appAccent, fontWeight:700, textTransform:"uppercase", margin:"2px 0 7px" }}>Come funziona</div>

        <Chapter id="idea" icon="💡" title="L'idea in un minuto">
          <p style={{margin:"6px 0"}}>Questa è la vostra cucina digitale condivisa: le ricette di famiglia, cosa comprare, cosa cucinare con quello che avete in casa, quante calorie ha un piatto — e i ricordi legati ai piatti che fate.</p>
          <p style={{margin:"6px 0"}}>La parte speciale: <b>le sezioni non sono scollegate</b>. Se scrivi bene una ricetta e compili le impostazioni, l'app usa quelle informazioni ovunque, senza che tu ripeta niente.</p>
          <Key>🔑 <b>La regola d'oro:</b> più curi le ricette e la sezione Organizza, più l'app diventa intelligente. Insegni una volta, raccogli i frutti sempre.</Key>
          <Tip>💡 Non serve capire tutto subito: parti dalle ricette, il resto lo aggiungi quando ti serve.</Tip>
          <p style={{margin:"10px 0 2px", fontWeight:700}}>Da dove comincio?</p>
          <p style={{margin:"0 0 6px"}}>Inserisci due o tre ricette che fate spesso. Poi prova la Modalità Cucina. Organizza compilalo dopo, quando l'app ti segnala che manca qualcosa — ogni schermata ha il suo pulsante <b>ⓘ</b> con la guida di quella sezione, non serve imparare tutto da qui.</p>
        </Chapter>

        <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, textAlign:"center", margin:"12px 0 2px", fontStyle:"italic" }}>
          Il resto della guida è nel pulsante <b>ⓘ</b> di ogni schermata — testi mirati a quello che stai facendo in quel momento.
        </div>

        <div style={{ textAlign:"center", fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:14 }}>
          Il mio Ricettario · guida
        </div>
      </div>
    </div>
  );
}
