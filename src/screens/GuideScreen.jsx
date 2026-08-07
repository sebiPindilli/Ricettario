import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import diagVista from "../assets/architettura/vista-insieme.svg";
import diagNutrizione from "../assets/architettura/nutrizione-aggregati.svg";
import diagCreazione from "../assets/architettura/creazione-ricetta.svg";

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

        <Chapter id="mappa" icon="🗺️" title="Come tutto si collega">
          <p style={{margin:"6px 0"}}>Una ricetta nasce in <b>tre modi</b>: la scrivi a mano ✏️, la fotografi 📷, o scegli una foto dalla galleria 🗃️. In tutti i casi finisce nello stesso posto.</p>
          <div style={{ background:th.appBg, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"12px 10px", margin:"10px 0", textAlign:"center", fontFamily:F.ui, fontSize:11, lineHeight:1.9 }}>
            <div style={{ color:th.appFaded, fontSize:9.5 }}>✏️ a mano · 📷 foto · 🗃️ galleria</div>
            <div style={{ color:th.appFaded }}>↓</div>
            <div style={{ fontWeight:700, color:th.appAccent, fontSize:12.5 }}>📖 LA RICETTA</div>
            <div style={{ color:th.appFaded, fontSize:9.5 }}>↓ i suoi ingredienti alimentano ↓</div>
            <div style={{ fontWeight:700, color:th.appInk }}>🧊 Frigo · 🛒 Spesa · 🍎 Nutrizione</div>
            <div style={{ color:"#b8973a", fontStyle:"italic", fontSize:9.5 }}>↑ le regole arrivano a tutte e tre ↑</div>
            <div style={{ fontWeight:700, color:"#b8973a" }}>🍎⚙️ ORGANIZZA</div>
          </div>
          <p style={{margin:"6px 0"}}><b>Dall'alto:</b> gli ingredienti che scrivi in una ricetta alimentano da soli Frigo, Spesa e Nutrizione. Non li reinserisci mai.</p>
          <p style={{margin:"6px 0"}}><b>Dal basso:</b> le regole che imposti in <b>Organizza</b> (conversioni, categorie, collegamenti) arrivano a tutte e tre. Le definisci una volta, valgono sempre.</p>
          <p style={{margin:"6px 0"}}>Quando è ora di cucinare, la stessa ricetta si apre in <b>Modalità Cucina</b>: lì il lavoro delle altre sezioni diventa un piatto in tavola.</p>
          <Key>🔑 <b>Esempio:</b> in Organizza dici una volta che «1 cucchiaio di farina = 10 g». Da allora la Spesa somma bene anche se una ricetta usa cucchiai e un'altra grammi, e la Nutrizione sa quanti grammi contare.</Key>
          <Tip>💡 Se salti Organizza l'app funziona lo stesso, ma "alla cieca": non unisce cipolla bianca e rossa nella spesa, non calcola le calorie di ciò che non è collegato.</Tip>

          <div style={{ marginTop:16, paddingTop:12, borderTop:`1px dashed ${th.appBorder}` }}>
            <div style={{ fontFamily:F.ui, fontSize:11, fontWeight:700, color:th.appFaded, marginBottom:6 }}>
              🔬 Per chi è curioso: gli schemi tecnici "sotto il cofano"
            </div>
            <p style={{margin:"6px 0"}}>Tre diagrammi per chi vuole vedere in dettaglio come si muovono i dati nel codice: la vista d'insieme, il calcolo di nutrizione ed ereditarietà degli aggregati, e il flusso di creazione di una ricetta. Scorri i riquadri per vederli per intero.</p>

            <div style={{ margin:"10px 0" }}>
              <div style={{ fontWeight:700, fontSize:11.5, color:th.appInk, marginBottom:4 }}>1 · Vista d'insieme</div>
              <div style={{ overflow:"auto", maxHeight:360, border:`1px solid ${th.appBorder}`, borderRadius:10, background:"#fff", padding:8 }}>
                <img src={diagVista} alt="Diagramma: vista d'insieme del flusso dati" style={{ minWidth:640, display:"block" }}/>
              </div>
            </div>

            <div style={{ margin:"10px 0" }}>
              <div style={{ fontWeight:700, fontSize:11.5, color:th.appInk, marginBottom:4 }}>2 · Nutrizione + aggregati</div>
              <div style={{ overflow:"auto", maxHeight:360, border:`1px solid ${th.appBorder}`, borderRadius:10, background:"#fff", padding:8 }}>
                <img src={diagNutrizione} alt="Diagramma: calcolo nutrizionale ed ereditarietà degli aggregati" style={{ minWidth:640, display:"block" }}/>
              </div>
            </div>

            <div style={{ margin:"10px 0" }}>
              <div style={{ fontWeight:700, fontSize:11.5, color:th.appInk, marginBottom:4 }}>3 · Creazione/importazione ricetta</div>
              <div style={{ overflow:"auto", maxHeight:360, border:`1px solid ${th.appBorder}`, borderRadius:10, background:"#fff", padding:8 }}>
                <img src={diagCreazione} alt="Diagramma: flusso di creazione e importazione di una ricetta" style={{ minWidth:640, display:"block" }}/>
              </div>
            </div>

            <div style={{ fontSize:10, color:th.appFaded, fontStyle:"italic" }}>
              Versione testuale/modificabile in <code>docs/architettura.md</code> (formato Mermaid).
            </div>
          </div>
        </Chapter>

        <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, textAlign:"center", margin:"12px 0 2px", fontStyle:"italic" }}>
          Il resto della guida è nel pulsante <b>ⓘ</b> di ogni schermata — testi mirati a quello che stai facendo in quel momento.
        </div>

        <div style={{ textAlign:"center", fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:14 }}>
          Il mio Ricettario · guida · versione prototipo
        </div>
      </div>
    </div>
  );
}
