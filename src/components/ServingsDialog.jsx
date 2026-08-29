import React, { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import { flattenIngredients, ingredientToText, ingredientParts, fmtQty } from "../utils/helpers.js";
import InfoButton from "./InfoButton.jsx";
import { guideCalcoloDosi } from "../data/guideContent.jsx";

const DOSE_SHORTCUTS = [
  { factor: 0.5, label: "½" },
  { factor: 1, label: "standard" },
  { factor: 1.5, label: "×1,5" },
  { factor: 2, label: "×2" },
];

export default function ServingsDialog({ recipe, title, emoji, onConfirm, onClose, initialScale = null }) {
  const th = useTheme();
  const ui = useUiStyle();
  // Fase 7 (DECISIONI.md §Calcolo dosi): tre schede pari grado solo su
  // quaderno/schedario, si apre sempre su Dosi.
  const dialogTabs = ui.dialogTabs === true;
  const baseServings = recipe.servings || 4;
  const initMode = dialogTabs
    ? "base" // "Si apre sempre su Dosi" (DECISIONI.md §Calcolo dosi)
    : (initialScale
        ? (initialScale.factor === 1 ? "base" : (initialScale.people != null ? "people" : "limiting"))
        : "people");
  const [mode, setMode] = useState(initMode); // "base" | "people" | "limiting"
  const [people, setPeople] = useState(initialScale?.people || baseServings);
  const [doseFactor, setDoseFactor] = useState(1); // scorciatoie della scheda Dosi
  // Ingrediente limitante
  const parseable = flattenIngredients(recipe.ingredients).filter(ing => ing.qty != null && ing.qty > 0);
  const [limIdx, setLimIdx] = useState(0);
  const [limHave, setLimHave] = useState("");

  const limSel = parseable[limIdx] || null;
  const limParsed = limSel ? { amount: limSel.qty, unit: limSel.unit } : null;
  const limFactor = (limParsed && limHave && parseFloat(limHave.replace(",", ".")) > 0)
    ? parseFloat(limHave.replace(",", ".")) / limParsed.amount
    : null;
  const limServings = limFactor != null ? Math.round(baseServings * limFactor * 10) / 10 : null;

  const confirm = () => {
    if (mode === "base") {
      if (dialogTabs && doseFactor !== 1) {
        const scaledServings = Math.round(baseServings * doseFactor * 10) / 10;
        onConfirm({ factor: doseFactor, people: scaledServings, label: `dosi ×${fmtQty(doseFactor)} (${scaledServings} porzioni circa)` });
      } else {
        onConfirm({ factor: 1, people: baseServings, label: `dosi standard (${baseServings} porzioni)` });
      }
    } else if (mode === "people") {
      onConfirm({ factor: people / baseServings, people, label: `${baseServings} → ${people} porzioni (×${Math.round(people/baseServings*100)/100})` });
    } else if (mode === "limiting" && limFactor) {
      onConfirm({ factor: limFactor, people: null, label: `in base a ${limSel.name}: ${limHave} ${limParsed.unit || "unità"} disponibili (×${Math.round(limFactor*100)/100})` });
    }
  };

  const canConfirm = mode !== "limiting" || !!limFactor;
  const peopleShortcuts = Array.from(new Set([4, baseServings, 12, 16])).filter(n => n > 0);

  const OptCard = ({ id, icon, label, desc }) => (
    <button onClick={() => setMode(id)} style={{
      flex:1, padding:"10px 8px", borderRadius:12, cursor:"pointer",
      border:`1.5px solid ${mode===id ? th.appAccent : th.appBorder}`,
      background: mode===id ? `${th.appAccent}12` : "transparent",
      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
    }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <span style={{ fontFamily:F.ui, fontSize:10, fontWeight:700, color: mode===id ? th.appAccent : th.appInk }}>{label}</span>
      <span style={{ fontFamily:F.ui, fontSize:8.5, color:th.appFaded, lineHeight:1.3 }}>{desc}</span>
    </button>
  );

  const tabs = [
    { id:"base", label:"Dosi" },
    { id:"people", label:"Persone" },
    ...(parseable.length > 0 ? [{ id:"limiting", label:"Da un ingrediente" }] : []),
  ];

  return (
    <div style={{ position:"absolute", inset:0, zIndex:400, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", background:th.appBg, borderRadius:20, padding:"22px 20px", textAlign:"center", maxHeight:"90%", overflowY:"auto", position:"relative" }}>
        <InfoButton triggerStyle={{ position:"absolute", top:14, right:14 }}>{guideCalcoloDosi}</InfoButton>
        <div style={{ fontSize:32, marginBottom:4 }}>{emoji}</div>
        <div style={{ fontFamily:F.display, fontSize:19, color:th.appInk, marginBottom:12 }}>{title}</div>

        {dialogTabs ? (
          // Tre schede pari grado (DECISIONI.md §Calcolo dosi): fondo ui.card
          // sull'attiva, testo ui.ink peso 700; contenitore ui.border r12 p4.
          <div style={{ display:"flex", gap:4, marginBottom:16, background:ui.border, borderRadius:12, padding:4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setMode(t.id)} style={{
                flex:1, padding:"9px 8px", borderRadius:9, border:"none", cursor:"pointer",
                background: mode===t.id ? ui.card : "transparent",
                color: mode===t.id ? ui.ink : ui.muted,
                fontFamily:F.ui, fontSize:12, fontWeight: mode===t.id ? 700 : 500,
              }}>{t.label}</button>
            ))}
          </div>
        ) : (
          <div style={{ display:"flex", gap:6, marginBottom:16 }}>
            <OptCard id="base"     icon="📄" label="Standard"     desc="dosi della ricetta"/>
            <OptCard id="people"   icon="👥" label="Persone"      desc="ricalcola per commensali"/>
            {parseable.length > 0 && (
              <OptCard id="limiting" icon="⚖️" label="Ingrediente"  desc="in base a ciò che hai"/>
            )}
          </div>
        )}

        {/* Contenuto per modalità */}
        {mode === "base" && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginBottom: dialogTabs ? 10 : 0 }}>
              Prosegui con le quantità originali della ricetta ({baseServings} porzioni).
            </div>
            {dialogTabs && (
              <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
                {DOSE_SHORTCUTS.map(({ factor, label }) => (
                  <button key={label} onClick={() => setDoseFactor(factor)} style={{
                    padding:"6px 14px", borderRadius:ui.radius.chip,
                    border:`1.5px solid ${doseFactor===factor ? th.appAccent : th.appBorder}`,
                    background: doseFactor===factor ? `${th.appAccent}12` : "transparent",
                    color: doseFactor===factor ? th.appAccent : th.appFaded,
                    fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
                  }}>{label}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === "people" && (
          <>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20, marginBottom:12 }}>
              <button onClick={() => setPeople(p => Math.max(1, p-1))} style={{ width:44, height:44, borderRadius:"50%", border:`1.5px solid ${th.appBorder}`, background:th.appCard, fontSize:22, color:th.appInk, cursor:"pointer" }}>−</button>
              <div style={{ minWidth:70 }}>
                <div style={{ fontFamily:F.display, fontSize:38, color:th.appAccent, lineHeight:1 }}>{people}</div>
                <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:2 }}>person{people===1?"a":"e"}</div>
              </div>
              <button onClick={() => setPeople(p => Math.min(50, p+1))} style={{ width:44, height:44, borderRadius:"50%", border:`1.5px solid ${th.appBorder}`, background:th.appCard, fontSize:22, color:th.appInk, cursor:"pointer" }}>＋</button>
            </div>
            {dialogTabs && (
              <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:12, flexWrap:"wrap" }}>
                {peopleShortcuts.map(n => (
                  <button key={n} onClick={() => setPeople(n)} style={{
                    padding:"5px 12px", borderRadius:14,
                    border:`1.5px solid ${people===n ? th.appAccent : th.appBorder}`,
                    background: people===n ? `${th.appAccent}12` : "transparent",
                    color: people===n ? th.appAccent : th.appFaded,
                    fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
                  }}>{n === baseServings ? "standard" : n}</button>
                ))}
              </div>
            )}
            {/* "Nessuna riga di verifica come cambia" (DECISIONI.md): solo in classico */}
            {!dialogTabs && people !== baseServings && (
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:12 }}>
                ricetta originale per {baseServings} — quantità ×{Math.round(people/baseServings*100)/100}
              </div>
            )}
          </>
        )}

        {mode === "limiting" && (
          <div style={{ marginBottom:14, textAlign:"left" }}>
            {parseable.length === 0 ? (
              <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, textAlign:"center" }}>
                Nessun ingrediente con quantità numerica in questa ricetta.
              </div>
            ) : dialogTabs ? (
              <>
                <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:ui.muted, textTransform:"uppercase", marginBottom:5 }}>Ingrediente limitante</div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:10, maxHeight:180, overflowY:"auto" }}>
                  {parseable.map((ing, i) => {
                    const parts = ingredientParts(ing);
                    return (
                      <button key={i} onClick={() => setLimIdx(i)} style={{
                        display:"flex", justifyContent:"space-between", alignItems:"center", gap:10,
                        padding:"9px 12px", borderRadius:ui.radius.control,
                        border:`1.5px solid ${limIdx===i ? th.appAccent : ui.border}`,
                        background: limIdx===i ? `${th.appAccent}12` : ui.card,
                        cursor:"pointer", textAlign:"left", width:"100%",
                      }}>
                        <span style={{ fontFamily:F.body, fontSize:13, color:ui.ink }}>{parts.name}</span>
                        <span style={{ fontFamily:F.mono, fontSize:12, color:ui.faded, flexShrink:0 }}>{parts.amount}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:ui.muted, textTransform:"uppercase", marginBottom:5 }}>
                  Quanto ne hai? {limParsed?.unit ? `(in ${limParsed.unit})` : ""}
                </div>
                <input
                  type="number"
                  value={limHave}
                  onChange={e => setLimHave(e.target.value)}
                  placeholder={limParsed ? `la ricetta ne chiede ${fmtQty(limParsed.amount)} ${limParsed.unit || ""}`.trim() : ""}
                  style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${limFactor ? th.appAccent : ui.border}`, borderRadius:ui.radius.control, background:ui.card, fontFamily:F.body, fontSize:13, color:ui.ink, outline:"none", boxSizing:"border-box" }}
                />
                {limFactor && (
                  <div style={{ fontFamily:F.ui, fontSize:11, color:th.appAccent, marginTop:8, textAlign:"center", fontWeight:600 }}>
                    → {limServings} porzion{limServings===1?"e":"i"}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:5 }}>Ingrediente limitante</div>
                <select
                  value={limIdx}
                  onChange={e => setLimIdx(Number(e.target.value))}
                  style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appCard, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", marginBottom:10 }}
                >
                  {parseable.map((ing, i) => <option key={i} value={i}>{ingredientToText(ing)}</option>)}
                </select>
                <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:5 }}>
                  Quanto ne hai? {limParsed?.unit ? `(in ${limParsed.unit})` : ""}
                </div>
                <input
                  type="number"
                  value={limHave}
                  onChange={e => setLimHave(e.target.value)}
                  placeholder={limParsed ? `la ricetta ne chiede ${fmtQty(limParsed.amount)} ${limParsed.unit || ""}`.trim() : ""}
                  style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${limFactor ? th.appAccent : th.appBorder}`, borderRadius:10, background:th.appCard, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", boxSizing:"border-box" }}
                />
                {limFactor && (
                  <div style={{ fontFamily:F.ui, fontSize:11, color:th.appAccent, marginTop:8, textAlign:"center", fontWeight:600 }}>
                    tutte le quantità ×{Math.round(limFactor*100)/100}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"13px", border:`1.5px solid ${th.appBorder}`, borderRadius:12, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:13, cursor:"pointer" }}>Annulla</button>
          <button onClick={confirm} disabled={!canConfirm} style={{ flex:2, padding:"13px", border:"none", borderRadius:12, background: canConfirm ? th.appAccent : th.appBorder, color: canConfirm ? "#fff" : th.appFaded, fontFamily:F.ui, fontSize:13, fontWeight:700, cursor: canConfirm ? "pointer" : "default" }}>Applica ✓</button>
        </div>
      </div>
    </div>
  );
}
