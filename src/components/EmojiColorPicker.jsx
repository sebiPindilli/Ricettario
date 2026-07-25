import { useState } from "react";
import { F, EMOJI_CATEGORIES, COLOR_OPTIONS } from "../data/constants.js";
import ScanLabel from "./ScanLabel.jsx";

export default function EmojiColorPicker({ emoji, color, onEmoji, onColor }) {
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
          background:color, flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:24, boxShadow:`0 3px 10px ${color}55`,
          transition:"all 0.2s",
        }}>{emoji}</div>
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
          <button key={e} onClick={() => onEmoji(e)} style={{
            width:36, height:36, borderRadius:8,
            background: emoji===e ? color+"22" : "transparent",
            border:`1.5px solid ${emoji===e ? color : "transparent"}`,
            cursor:"pointer", fontSize:20,
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.15s",
          }}>{e}</button>
        ))}
      </div>
    </div>
  );
}
