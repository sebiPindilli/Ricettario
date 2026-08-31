import React from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import BackBtn from "../components/BackBtn.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";
import ChosenIcon from "../components/ChosenIcon.jsx";
import AppIcon from "../components/AppIcon.jsx";

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
export default function AddRecipeHubScreen({ onBack, onManual, onScan, onLink, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping, pendingExtractions=[], onOpenPending, onDiscardPending }) {
  const th = useTheme();
  const ui = useUiStyle();
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {ui.header === "legacy" && (
        <div style={{ padding:"8px 20px 0" }}>
          <BackBtn onBack={onBack} label="Annulla"/>
        </div>
      )}
      <ScreenHeader title="Aggiungi Ricetta" subtitle="Scegli come vuoi inserirla" onBack={onBack} onHome={onLanding}/>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:`32px ${ui.padX}px`, gap:16 }}>
        {ui.header === "legacy" && (
          <div style={{ textAlign:"center", marginBottom:8 }}>
            <div style={{ fontFamily:F.display, fontSize:26, color:th.appInk, fontStyle:"italic" }}>Aggiungi Ricetta</div>
            <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:6 }}>Scegli come vuoi inserirla</div>
          </div>
        )}

        {pendingExtractions.length > 0 && (
          <div style={{ width:"100%" }}>
            <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:8 }}>
              Estrazioni da confermare
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>
              {pendingExtractions.map(p => (
                <div key={p.id} style={{
                  display:"flex", alignItems:"center", gap:12,
                  ...ui.cardStyle, padding:"10px 12px",
                }}>
                  <button onClick={() => onOpenPending(p)} style={{
                    flex:1, minWidth:0, display:"flex", alignItems:"center", gap:12,
                    background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:0,
                  }}>
                    <div style={{
                      width:38, height:38, borderRadius:10, background:p.draft.color || th.appAccent, color:"#fff",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                    }}><ChosenIcon emoji={p.draft.emoji || "🍝"} icon={p.draft.icon} size={19} /></div>
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
            icon:"✏️", svgIcon:"modifica",
            label:"Inserimento manuale",
            desc:"Scrivi titolo, ingredienti e preparazione direttamente in app",
            fn:onManual,
            color:th.appInk, iconColor:th.appBg,
          },
          {
            icon:"📷", svgIcon:"foto",
            label:"Scansiona dalla fotocamera",
            desc:"Fotografa una ricetta scritta o stampata — OCR + AI la digitalizza",
            fn:() => onScan("camera"),
            color:th.appAccent, iconColor:th.appOnAccent,
          },
          {
            icon:"🗃️",
            label:"Importa dalla galleria",
            desc:"Scegli una foto già scattata dalla tua libreria fotografica",
            fn:() => onScan("gallery"),
            // Classico mantiene il vecchio viola scritto a mano; negli stili
            // nuovi il colore arriva dalla sezione "altro" del tema (nessun
            // colore arbitrario nuovo — vedi ui.sectionColorFull).
            color: ui.sectionColorFull("altro") || "#6B4A8B", iconColor:"#fff",
          },
          {
            icon:"🔗", svgIcon:"link",
            label:"Aggiungi da link",
            desc:"Incolla il link di una ricetta trovata online — l'AI la importa per te",
            fn:onLink,
            color:th.appAccent2, iconColor:th.appOnAccent,
          },
        ].map(item => (
          // Stessa idea di RecipeCardList: in "quaderno" (listRow "rule")
          // niente card, solo un filetto sotto ogni riga.
          <button key={item.label} onClick={item.fn} style={{
            width:"100%", padding: ui.listRow==="rule" ? "14px 2px" : "18px 20px",
            background: ui.listRow==="rule" ? "transparent" : ui.card,
            border: ui.listRow==="rule" ? "none" : `1px solid ${ui.border}`,
            borderBottom: `1px solid ${ui.listRow==="rule" ? ui.hairline : ui.border}`,
            borderRadius: ui.listRow==="rule" ? 0 : ui.radius.card,
            boxShadow: ui.listRow==="rule" ? "none" : ui.shadow,
            cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", gap:16,
          }}>
            <div style={{ width:52, height:52, borderRadius:ui.radius.tile, background:item.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
              <AppIcon emoji={item.icon} icon={item.svgIcon} size={26} style={{ color:item.iconColor }}/>
            </div>
            <div>
              <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, marginBottom:3 }}>{item.label}</div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.4 }}>{item.desc}</div>
            </div>
            <span style={{ marginLeft:"auto", color:th.appFaded, fontSize:18, flexShrink:0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
