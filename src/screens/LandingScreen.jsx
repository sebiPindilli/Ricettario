import React from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import OrganizeIcon from "../components/OrganizeIcon.jsx";

export default function LandingScreen({ recipes = [], bookName = "Il mio Ricettario", onBooks, onRecipes, onBook, onMemories, onAdd, onAddMemory, onFridge, onShopping, onOrganize, onTheme, onCover, onGuide }) {
  const th = useTheme();

  const mainItems = [
    { emoji:"🍽️", label:"Libro Ricette",         desc:"Sfoglia, cerca e aggiungi",   fn:onRecipes, color:th.appAccent },
    { emoji:"📒", label:"Libro dei Ricordi",     desc:"Tutte le fotografie",         fn:onMemories,color:"#6B8C6E" },
    { emoji:"🧊", label:"Svuota Frigo",          desc:"Cosa cucino con ciò che ho",  fn:onFridge,  color:"#5B7FA6" },
    { emoji:"🛒", label:"Lista Spesa",           desc:"Gli ingredienti da comprare", fn:onShopping,color:"#8C6E4A" },
    { emoji:<OrganizeIcon/>, label:"Organizza Ingredienti", desc:"Aggregati, categorie, nutrizione", fn:onOrganize, color:"#7A5EA6" },
  ];

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>

      {/* Top row: copertina · info · stile — icone uniformi */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"8px 20px 0" }}>
        <button onClick={onCover} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
          <span style={{ width:26, height:26, borderRadius:7, background:th.appCard, border:`1.5px solid ${th.appBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, boxSizing:"border-box" }}>📕</span>
          <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>copertina</span>
        </button>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onGuide} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
            <span style={{ width:26, height:26, borderRadius:7, background:th.appCard, border:`1.5px solid ${th.appBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, boxSizing:"border-box" }}>ℹ️</span>
            <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>info</span>
          </button>
          <button onClick={onTheme} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
            <span style={{ width:26, height:26, borderRadius:7, background:th.coverBg, border:`1.5px solid ${th.appBorder}`, display:"block", boxSizing:"border-box" }}/>
            <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>stile</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign:"center", padding:"20px 24px 8px" }}>
        <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:3, color:th.appFaded, textTransform:"uppercase" }}>Il mio</div>
        <div style={{ fontFamily:F.display, fontSize:36, color:th.appInk, fontStyle:"italic" }}>Ricettario</div>
        {/* Selettore ricettario attivo */}
        <div style={{ marginTop:8 }}>
          <button onClick={onBooks} style={{
            background:th.appCard, border:`1.5px solid ${th.appBorder}`,
            borderRadius:20, padding:"7px 14px", cursor:"pointer",
            fontFamily:F.ui, fontSize:11, color:th.appInk,
            display:"inline-flex", alignItems:"center", gap:6,
            maxWidth:"88%",
          }}>
            📚 <span style={{ color:th.appFaded }}>Ricettario attivo:</span>
            <span style={{ fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{bookName}</span>
            <span style={{ color:th.appFaded }}>▾</span>
          </button>
        </div>
        {/* Sottotitolo: apri in modalità libro */}
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"10px 0" }}>
          <div style={{ flex:1, height:1, background:th.appBorder }}/>
          <span style={{ color:th.appAccent2, fontSize:12 }}>✦</span>
          <div style={{ flex:1, height:1, background:th.appBorder }}/>
        </div>
      </div>

      {/* Main navigation cards */}
      <div style={{ padding:"0 24px", display:"flex", flexDirection:"column", gap:12, flex:1 }}>
        {mainItems.map(item => (
          <button key={item.label} onClick={item.fn} style={{
            width:"100%", padding:"16px 18px",
            background:th.appCard, border:`1px solid ${th.appBorder}`,
            borderRadius:18, cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", gap:14,
            boxShadow:`0 2px 12px rgba(0,0,0,0.05)`,
          }}>
            <div style={{ width:48, height:48, borderRadius:13, background:item.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{item.emoji}</div>
            <div>
              <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, marginBottom:2 }}>{item.label}</div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>{item.desc}</div>
            </div>
            <span style={{ marginLeft:"auto", color:th.appFaded, fontSize:18 }}>›</span>
          </button>
        ))}

      </div>

      <div style={{ height:32 }}/>
    </div>
  );
}
