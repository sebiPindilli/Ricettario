import { useState } from "react";
import { F, EMOJI_CATEGORIES, COLOR_OPTIONS } from "../data/constants.js";
import ScanLabel from "./ScanLabel.jsx";
import ChosenIcon from "./ChosenIcon.jsx";
import FoodIconGrid from "./FoodIconGrid.jsx";

// icon/onIcon: icona SVG scelta in alternativa all'emoji (vedi
// data/foodIcons.js) — icon ha sempre la precedenza su emoji quando
// presente (vedi ChosenIcon.jsx), ma emoji resta comunque salvata: se poi
// si sceglie di nuovo un'emoji, onIcon(undefined) la cancella e si torna a
// quella. Nessuna delle due scelte segue l'interruttore globale
// dell'admin (quello riguarda solo le icone fisse dell'interfaccia).
export default function EmojiColorPicker({ emoji, color, icon, onEmoji, onColor, onIcon }) {
  const [mode, setMode] = useState(icon ? "svg" : "emoji"); // "emoji" | "svg"
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].label);
  const currentEmojis = EMOJI_CATEGORIES.find(c => c.label === activeCategory)?.emojis || [];

  return (
    <div style={{
      background:"#F7F2E8", border:`1px solid #EDE6D4`,
      borderRadius:14, padding:"12px 14px",
    }}>
      <ScanLabel text="Scegli icona e colore per la lista"/>

      {/* Preview + color row */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        {/* Live mini-card preview */}
        <div style={{
          width:46, height:46, borderRadius:10,
          background:color, flexShrink:0, color:"#fff",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 3px 10px ${color}55`,
          transition:"all 0.2s",
        }}><ChosenIcon emoji={emoji} icon={icon} size={24} /></div>
        {/* Color dots */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", flex:1 }}>
          {COLOR_OPTIONS.map(c => (
            <button key={c} onClick={() => onColor(c)} style={{
              width:22, height:22, borderRadius:"50%",
              background:c,
              border: color===c ? `2.5px solid ${"#2C2416"}` : "2.5px solid transparent",
              outline: color===c ? "2px solid #fff" : "none", outlineOffset:1,
              cursor:"pointer", padding:0, transition:"transform 0.1s",
            }}/>
          ))}
        </div>
      </div>

      {/* Primo livello: Emoji o SVG */}
      <div style={{ display:"flex", borderRadius:20, overflow:"hidden", border:"1.5px solid #EDE6D4", marginBottom:10, width:"fit-content" }}>
        {[["emoji","Emoji"],["svg","SVG"]].map(([id,label]) => (
          <button key={id} onClick={() => setMode(id)} style={{
            padding:"6px 16px", border:"none", cursor:"pointer",
            background: mode===id ? "#2C2416" : "transparent",
            color: mode===id ? "#fff" : "#7A6E5F",
            fontFamily:F.ui, fontSize:11, fontWeight:700,
          }}>{label}</button>
        ))}
      </div>

      {mode === "emoji" ? (
        <>
          {/* Category tabs */}
          <div style={{ display:"flex", gap:4, overflowX:"auto", marginBottom:8, scrollbarWidth:"none", paddingBottom:2 }}>
            {EMOJI_CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => setActiveCategory(cat.label)} style={{
                flexShrink:0, padding:"4px 10px", borderRadius:20, border:"none",
                background: activeCategory===cat.label ? "#2C2416" : "transparent",
                color: activeCategory===cat.label ? "#fff" : "#7A6E5F",
                fontFamily:F.ui, fontSize:10, fontWeight:600,
                cursor:"pointer", whiteSpace:"nowrap",
              }}>{cat.label}</button>
            ))}
          </div>

          {/* Emoji grid for active category */}
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {currentEmojis.map(e => (
              <button key={e} onClick={() => { onEmoji(e); onIcon && onIcon(undefined); }} style={{
                width:36, height:36, borderRadius:8,
                background: !icon && emoji===e ? color+"22" : "transparent",
                border:`1.5px solid ${!icon && emoji===e ? color : "transparent"}`,
                cursor:"pointer", fontSize:20,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.15s",
              }}>{e}</button>
            ))}
          </div>
        </>
      ) : (
        <FoodIconGrid value={icon} onSelect={n => onIcon && onIcon(n)} accent={color} />
      )}
    </div>
  );
}
