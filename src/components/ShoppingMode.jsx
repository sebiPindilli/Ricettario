import React, { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import { flattenIngredients, scaleIngredient, normName, fmtQty } from "../utils/helpers.js";
import InfoButton from "./InfoButton.jsx";
import AppIcon from "./AppIcon.jsx";
import { guideModalitaSpesa } from "../data/guideContent.jsx";

// ══════════════════════════════════════════════════════════════
// MODALITÀ SPESA — checklist ingredienti scalati, copia selezione
// ══════════════════════════════════════════════════════════════
export default function ShoppingMode({ recipe, scale, onClose, onAddToList, preselectClean = null }) {
  const th = useTheme();
  const ui = useUiStyle();
  // "stesse spunte e stessa barra di completamento della Lista Spesa,
  // niente stile proprio" (DECISIONI.md, vale solo per quaderno/schedario:
  // il resto del componente/classico restano come prima).
  const isNew = ui.id !== "classico";
  const factor = scale?.factor ?? 1;
  const items = flattenIngredients(recipe.ingredients).map((ing, i) => {
    const scaled = scaleIngredient(ing, factor);
    const qtyParts = [];
    if (scaled.qty != null) qtyParts.push(fmtQty(scaled.qty));
    if (scaled.unit) qtyParts.push(scaled.unit);
    return {
      id: i, ing: scaled, section: ing.section,
      clean: normName(ing.name),
      nameText: scaled.note ? `${scaled.name} (${scaled.note})` : scaled.name,
      qtyText: qtyParts.join(" "),
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
    <div style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxHeight:"90%", background:th.appBg, borderRadius:20, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header — fisso in cima alla scheda, sempre scuro indipendente dal
            tema (th.darkChrome, come GlobalNav): appInk si inverte con
            temaScuro, qui servono sempre gli stessi bianchi trasparenti sotto. */}
        <div style={{ background:th.darkChrome.bg, padding:"14px 18px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:14, cursor:"pointer" }}>✕</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:15, color:"#fff", fontStyle:"italic" }}>🛒 Modalità Spesa</div>
            <div style={{ fontFamily:F.ui, fontSize:10, color:"rgba(255,255,255,0.55)" }}>{recipe.title} · {scale?.label || "dosi originali"}</div>
          </div>
          <div style={{ fontFamily: isNew ? F.mono : F.ui, fontSize:11, color:"rgba(255,255,255,0.7)" }}>{checked.length}/{items.length}</div>
          <InfoButton dark>{guideModalitaSpesa}</InfoButton>
        </div>

        {/* Barra di completamento — stessa di ShoppingListScreen (Fase 5) */}
        {isNew && items.length > 0 && (
          <div style={{ height:3, background:th.appBorder, flexShrink:0 }}>
            <div style={{ height:"100%", width:`${(checked.length/items.length)*100}%`, background:"#6B8C6E", transition:"width 0.2s" }}/>
          </div>
        )}

        {/* List — scrolla solo se non ci sta nello spazio rimasto sotto il tetto massimo della scheda */}
        <div style={{ flex:"1 1 auto", minHeight:0, overflowY:"auto", padding:"12px 18px" }}>
          {/* Instruction banner */}
          <div style={{
            background:`${th.appAccent}12`, border:`1px solid ${th.appAccent}44`,
            borderRadius:12, padding:"11px 14px", marginBottom:14,
            fontFamily:F.ui, fontSize:12, color:th.appInk, lineHeight:1.5,
            display:"flex", alignItems:"flex-start", gap:6,
          }}>
            <AppIcon emoji="✓" icon="fatto" size={13} /> <span>Gli ingredienti <b>selezionati</b> (spuntati) verranno aggiunti alla <b>Lista Spesa</b>. Deseleziona quelli che hai già in casa.</span>
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
                  <div style={{
                    width:22, height:22, flexShrink:0,
                    borderRadius: isNew && ui.id==="schedario" ? 6 : "50%",
                    border:`2px solid ${sel ? th.appAccent : th.appBorder}`,
                    background: sel ? th.appAccent : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13,
                  }}>{sel && !isNew ? "✓" : ""}</div>
                  <div style={{ flex:1, display:"flex", alignItems:"baseline", gap:8, minWidth:0 }}>
                    <span style={{ flex:1, fontFamily:F.body, fontSize:14, color: sel ? th.appInk : (isNew ? "#B0A694" : th.appFaded), textDecoration: sel ? "none" : "line-through", lineHeight:1.4 }}>{it.nameText}</span>
                    {it.qtyText && (
                      <span style={{ flexShrink:0, fontFamily: isNew ? F.mono : F.ui, fontSize:12.5, fontWeight:700, color: sel ? th.appAccent : (isNew ? "#B0A694" : th.appFaded), textDecoration: sel ? "none" : "line-through" }}>{it.qtyText}</span>
                    )}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom bar — fisso in fondo alla scheda */}
        <div style={{ flexShrink:0, padding:"14px 18px 18px", borderTop:`1px solid ${th.appBorder}` }}>
          <button onClick={addSelected} disabled={checked.length===0} style={{
            width:"100%", padding:"15px",
            background: checked.length===0 ? th.appBorder : copied ? "#6B8C6E" : th.appAccent,
            color:"#fff", border:"none", borderRadius:14,
            fontFamily:F.ui, fontSize:14, fontWeight:700, cursor:"pointer",
            transition:"background 0.2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          }}>
            {copied
              ? <><AppIcon emoji="✓" icon="fatto" size={14} /> Aggiunto alla Lista Spesa!</>
              : <><AppIcon emoji="🛒" icon="spesa" size={14} /> {`Aggiungi alla Lista Spesa (${checked.length})`}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
