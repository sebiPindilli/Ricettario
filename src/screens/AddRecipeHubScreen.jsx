import React from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import GlobalNav from "../components/GlobalNav.jsx";

// ══════════════════════════════════════════════════════════════
// SCREEN: ADD RECIPE HUB — choose how to add
// ══════════════════════════════════════════════════════════════
export default function AddRecipeHubScreen({ onManual, onScan, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping }) {
  const th = useTheme();
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <GlobalNav
        activeScreen="add"
        onRecipes={onRecipes}
        onBook={onBook}
        onMemories={onMemories}
        onAdd={onAdd}
        onFridge={onFridge}
        onShopping={onShopping}
        onLanding={onLanding}
        onSearch={() => {}}
        onFavorites={() => {}}
        showSearch={false}
        showFavorites={false}
        activeLabel="Aggiungi"
      />

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 28px", gap:16 }}>
        <div style={{ textAlign:"center", marginBottom:8 }}>
          <div style={{ fontFamily:F.display, fontSize:26, color:th.appInk, fontStyle:"italic" }}>Aggiungi Ricetta</div>
          <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:6 }}>Scegli come vuoi inserirla</div>
        </div>

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
      </div>
    </div>
  );
}
