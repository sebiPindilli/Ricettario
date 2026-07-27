import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { flattenIngredients, scaleIngredient, ingredientToText, normName } from "../utils/helpers.js";

// ══════════════════════════════════════════════════════════════
// MODALITÀ SPESA — checklist ingredienti scalati, copia selezione
// ══════════════════════════════════════════════════════════════
export default function ShoppingMode({ recipe, scale, onClose, onAddToList, preselectClean = null }) {
  const th = useTheme();
  const factor = scale?.factor ?? 1;
  const items = flattenIngredients(recipe.ingredients).map((ing, i) => {
    const scaled = scaleIngredient(ing, factor);
    return {
      id: i, ing: scaled, text: ingredientToText(scaled), section: ing.section,
      original: ingredientToText(ing),
      clean: normName(ing.name),
    };
  });
  // Se preselectClean è fornito (nomi puliti degli ingredienti mancanti),
  // preseleziona solo quelli; altrimenti tutti.
  const initialChecked = preselectClean
    ? items.filter(it => preselectClean.some(m => it.clean.includes(m) || m.includes(it.clean))).map(it => it.id)
    : items.map(it => it.id);
  const [checked, setChecked] = useState(initialChecked);
  const [copied, setCopied] = useState(false);

  const toggleItem = (id) => setChecked(prev =>
    prev.includes(id) ? prev.filter(x => x!==id) : [...prev, id]
  );

  const addSelected = () => {
    const sel = items.filter(it => checked.includes(it.id));
    onAddToList && onAddToList(recipe, scale, sel);
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 900);
  };

  let lastSection = null;

  return (
    <div style={{ position:"absolute", inset:0, zIndex:400, background:th.appBg, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:th.appInk, padding:"14px 18px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:14, cursor:"pointer" }}>✕</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.display, fontSize:15, color:"#fff", fontStyle:"italic" }}>🛒 Modalità Spesa</div>
          <div style={{ fontFamily:F.ui, fontSize:10, color:"rgba(255,255,255,0.55)" }}>{recipe.title} · {scale?.label || "dosi originali"}</div>
        </div>
        <div style={{ fontFamily:F.ui, fontSize:11, color:"rgba(255,255,255,0.7)" }}>{checked.length}/{items.length}</div>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 18px 100px" }}>
        {/* Instruction banner */}
        <div style={{
          background:`${th.appAccent}12`, border:`1px solid ${th.appAccent}44`,
          borderRadius:12, padding:"11px 14px", marginBottom:14,
          fontFamily:F.ui, fontSize:12, color:th.appInk, lineHeight:1.5,
        }}>
          ✓ Gli ingredienti <b>selezionati</b> (spuntati) verranno aggiunti alla <b>Lista Spesa</b>. Deseleziona quelli che hai già in casa.
        </div>
        {items.map(it => {
          const showSection = it.section && it.section !== lastSection;
          lastSection = it.section;
          const sel = checked.includes(it.id);
          return (
            <React.Fragment key={it.id}>
              {showSection && (
                <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appAccent, textTransform:"uppercase", margin:"12px 0 6px", fontWeight:700 }}>{it.section}</div>
              )}
              <button onClick={() => toggleItem(it.id)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:12,
                padding:"11px 14px", marginBottom:6,
                background: sel ? th.appCard : `${th.appBorder}55`,
                border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                borderRadius:12, cursor:"pointer", textAlign:"left",
              }}>
                <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, border:`2px solid ${sel ? th.appAccent : th.appBorder}`, background: sel ? th.appAccent : "transparent", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13 }}>{sel ? "✓" : ""}</div>
                <span style={{ fontFamily:F.body, fontSize:14, color: sel ? th.appInk : th.appFaded, textDecoration: sel ? "none" : "line-through", lineHeight:1.4 }}>{it.text}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px 18px 22px", background:`linear-gradient(transparent, ${th.appBg} 30%)` }}>
        <button onClick={addSelected} disabled={checked.length===0} style={{
          width:"100%", padding:"15px",
          background: checked.length===0 ? th.appBorder : copied ? "#6B8C6E" : th.appAccent,
          color:"#fff", border:"none", borderRadius:14,
          fontFamily:F.ui, fontSize:14, fontWeight:700, cursor:"pointer",
          transition:"background 0.2s",
        }}>
          {copied ? "✓ Aggiunto alla Lista Spesa!" : `🛒 Aggiungi alla Lista Spesa (${checked.length})`}
        </button>
      </div>
    </div>
  );
}
