import React from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import BackBtn from "../components/BackBtn.jsx";

// Età della bozza in una didascalia breve, in italiano.
function ageLabel(createdAt) {
  const days = Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "oggi";
  if (days === 1) return "ieri";
  return `${days} giorni fa`;
}

// ══════════════════════════════════════════════════════════════
// SCREEN: ADD RECIPE HUB — choose how to add
// ══════════════════════════════════════════════════════════════
export default function AddRecipeHubScreen({ onBack, onManual, onScan, onLink, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping, pendingExtractions=[], onOpenPending, onDiscardPending, onImportCode }) {
  const th = useTheme();
  const [importOpen, setImportOpen] = React.useState(false);
  const [importVal, setImportVal] = React.useState("");
  const [importMsg, setImportMsg] = React.useState(null);
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"8px 20px 0" }}>
        <BackBtn onBack={onBack} label="Annulla"/>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 28px", gap:16 }}>
        <div style={{ textAlign:"center", marginBottom:8 }}>
          <div style={{ fontFamily:F.display, fontSize:26, color:th.appInk, fontStyle:"italic" }}>Aggiungi Ricetta</div>
          <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:6 }}>Scegli come vuoi inserirla</div>
        </div>

        {pendingExtractions.length > 0 && (
          <div style={{ width:"100%" }}>
            <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:8 }}>
              Estrazioni da confermare
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>
              {pendingExtractions.map(p => (
                <div key={p.id} style={{
                  display:"flex", alignItems:"center", gap:12,
                  background:th.appCard, border:`1px solid ${th.appBorder}`,
                  borderRadius:14, padding:"10px 12px",
                }}>
                  <button onClick={() => onOpenPending(p)} style={{
                    flex:1, minWidth:0, display:"flex", alignItems:"center", gap:12,
                    background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:0,
                  }}>
                    <div style={{
                      width:38, height:38, borderRadius:10, background:p.draft.color || th.appAccent,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, flexShrink:0,
                    }}>{p.draft.emoji || "🍝"}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontFamily:F.display, fontSize:14, color:th.appInk, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {p.draft.title?.trim() || "Ricetta senza titolo"}
                      </div>
                      <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginTop:1 }}>
                        Non salvata — {ageLabel(p.createdAt)}
                      </div>
                    </div>
                  </button>
                  <button onClick={() => onDiscardPending(p.id)} title="Scarta bozza" style={{
                    flexShrink:0, width:28, height:28, borderRadius:8, border:"none",
                    background:"transparent", color:th.appFaded, fontSize:14, cursor:"pointer",
                  }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {[
          {
            icon:"✏️",
            label:"Inserimento manuale",
            desc:"Scrivi titolo, ingredienti e preparazione direttamente in app",
            fn:onManual,
            color:th.appInk,
          },
          {
            icon:"📷",
            label:"Scansiona dalla fotocamera",
            desc:"Fotografa una ricetta scritta o stampata — OCR + AI la digitalizza",
            fn:() => onScan("camera"),
            color:th.appAccent,
          },
          {
            icon:"🗃️",
            label:"Importa dalla galleria",
            desc:"Scegli una foto già scattata dalla tua libreria fotografica",
            fn:() => onScan("gallery"),
            color:"#6B4A8B",
          },
          {
            icon:"🔗",
            label:"Aggiungi da link",
            desc:"Incolla il link di una ricetta trovata online — l'AI la importa per te",
            fn:onLink,
            color:th.appAccent2,
          },
          ...(onImportCode ? [{
            icon:"📥",
            label:"Importa da codice",
            desc:"Incolla un codice di condivisione ricevuto da un altro ricettario",
            fn:() => setImportOpen(o => !o),
            color:"#4A7A8C",
          }] : []),
        ].map(item => (
          <button key={item.label} onClick={item.fn} style={{
            width:"100%", padding:"18px 20px",
            background:th.appCard, border:`1px solid ${th.appBorder}`,
            borderRadius:18, cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", gap:16,
            boxShadow:"0 2px 12px rgba(0,0,0,0.05)",
          }}>
            <div style={{ width:52, height:52, borderRadius:14, background:item.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, marginBottom:3 }}>{item.label}</div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.4 }}>{item.desc}</div>
            </div>
            <span style={{ marginLeft:"auto", color:th.appFaded, fontSize:18, flexShrink:0 }}>›</span>
          </button>
        ))}

        {importOpen && onImportCode && (
          <div style={{ width:"100%", background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:14, padding:"12px" }}>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:8 }}>
              Incolla il codice ricevuto: le ricette verranno copiate nel ricettario attivo.
            </div>
            <textarea
              value={importVal}
              onChange={e => setImportVal(e.target.value)}
              placeholder="Incolla qui il codice…"
              style={{ width:"100%", height:80, padding:"9px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:"monospace", fontSize:10, color:th.appInk, boxSizing:"border-box", resize:"none", marginBottom:8 }}
            />
            {importMsg && (
              <div style={{ fontFamily:F.ui, fontSize:11.5, fontWeight:700, color: importMsg.ok ? "#6B8C6E" : "#C4593A", marginBottom:8 }}>
                {importMsg.ok
                  ? `✓ ${importMsg.count} ricett${importMsg.count===1?"a importata":"e importate"}!${importMsg.systemImported ? " Importate anche le impostazioni di Organizza Ingredienti." : ""}`
                  : "⚠️ Codice non valido"}
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setImportOpen(false); setImportVal(""); setImportMsg(null); }} style={{ flex:1, padding:"10px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Chiudi</button>
              <button onClick={() => {
                const res = onImportCode(importVal);
                setImportMsg(res);
                if (res.ok) setImportVal("");
              }} disabled={!importVal.trim()} style={{ flex:2, padding:"10px", border:"none", borderRadius:10, background: importVal.trim() ? th.appInk : th.appBorder, color: importVal.trim() ? "#fff" : th.appFaded, fontFamily:F.ui, fontSize:12, fontWeight:700, cursor: importVal.trim() ? "pointer" : "default" }}>Importa</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
