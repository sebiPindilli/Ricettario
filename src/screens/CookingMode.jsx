import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { flattenSteps, flattenIngredients, ingredientToText, scaleIngredient, stepNumberLabel } from "../utils/helpers.js";
import PhotoLightbox from "../components/PhotoLightbox.jsx";

// ══════════════════════════════════════════════════════════════
// MODALITÀ CUCINA — step by step a schermo intero, tap per avanzare
// ══════════════════════════════════════════════════════════════
export default function CookingMode({ recipe, scale, onClose }) {
  const th = useTheme();
  const baseServings = recipe.servings || 1;
  const factor = scale?.factor ?? 1;
  const scaled = factor !== 1;
  const steps = flattenSteps(recipe.steps);
  const ingredients = flattenIngredients(recipe.ingredients).map(ing => ({
    scaled: ingredientToText(scaleIngredient(ing, factor)),
    original: ingredientToText(ing),
  }));

  // idx: -1 = intro ingredienti, 0..steps.length-1 = step, steps.length = fine
  const [idx, setIdx] = useState(-1);
  const [lightbox, setLightbox] = useState(null);
  const isIntro = idx === -1;
  const isDone = idx >= steps.length;
  const step = steps[idx];

  const goTo = (target) => setIdx(target);
  const prev = () => setIdx(i => Math.max(-1, i - 1));
  const next = () => setIdx(i => Math.min(steps.length, i + 1));

  // ── Zone tap: sinistra = indietro, destra = avanti — niente doppio tap né
  // stato "completato": tap ripetuti per tornare indietro di più passi non
  // devono rischiare di essere letti come "avanti", e segnare un passo come
  // fatto non aggiunge informazione reale in questa modalità.
  const handleTap = (e) => {
    if (isDone) { onClose(); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX != null ? e.clientX : 0) - rect.left;
    const isRight = x >= rect.width / 2;
    if (isRight) next(); else prev();
  };

  // Raggruppa gli step per sezione per la barra di progressione
  const stepGroups = [];
  steps.forEach((s, i) => {
    const secName = s.section || "__nosec__";
    let g = stepGroups.find(x => x.section === secName);
    if (!g) { g = { section: secName, items: [] }; stepGroups.push(g); }
    g.items.push({ ...s, globalIdx: i });
  });

  // ── Barra di progressione interattiva ──
  const ProgressBar = () => (
    <div style={{ padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.1)", flexShrink:0, overflowX:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:"min-content" }}>
        {/* Icona ingredienti (intro) */}
        <button
          onClick={() => goTo(-1)}
          title="Ingredienti"
          style={{
            width:30, height:30, borderRadius:"50%", flexShrink:0, cursor:"pointer",
            border: isIntro ? `2px solid ${th.appAccent2}` : "2px solid rgba(255,255,255,0.2)",
            background: isIntro ? th.appAccent2 : "rgba(255,255,255,0.08)",
            color:"#fff", fontSize:13,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >🧾</button>

        {stepGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {/* Separatore sezione */}
            {group.section !== "__nosec__" && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, marginLeft:4 }}>
                <div style={{ fontFamily:F.ui, fontSize:8, letterSpacing:0.5, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", whiteSpace:"nowrap", marginBottom:2, maxWidth:70, overflow:"hidden", textOverflow:"ellipsis" }}>{group.section}</div>
              </div>
            )}
            {group.items.map(it => {
              const active = idx === it.globalIdx;
              const label = stepNumberLabel(it.sectionIndex, it.indexInSection);
              return (
                <button
                  key={it.globalIdx}
                  onClick={() => goTo(it.globalIdx)}
                  title={`Passo ${label}`}
                  style={{
                    minWidth:30, height:30, padding:"0 6px", borderRadius:15, flexShrink:0, cursor:"pointer",
                    border: active ? `2px solid ${th.appAccent2}` : "2px solid rgba(255,255,255,0.2)",
                    background: active ? th.appAccent : "rgba(255,255,255,0.08)",
                    color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.2s",
                  }}
                >{label}</button>
              );
            })}
          </React.Fragment>
        ))}

        {/* Icona fine */}
        <button
          onClick={() => goTo(steps.length)}
          title="Fine"
          style={{
            width:30, height:30, borderRadius:"50%", flexShrink:0, cursor:"pointer",
            border: isDone ? `2px solid ${th.appAccent2}` : "2px solid rgba(255,255,255,0.2)",
            background: isDone ? th.appAccent2 : "rgba(255,255,255,0.08)",
            color:"#fff", fontSize:13,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >🏁</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400, background:th.appInk, display:"flex", flexDirection:"column", color:"#fff" }}>
      {/* Header */}
      <div style={{ padding:"14px 18px 10px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontSize:14, cursor:"pointer" }}>✕</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.display, fontSize:14, fontStyle:"italic", color:"rgba(255,255,255,0.9)" }}>👨‍🍳 {recipe.title}</div>
          <div style={{ fontFamily:F.ui, fontSize:10, color:"rgba(255,255,255,0.5)" }}>
            {scale?.label || "dosi originali"}
          </div>
        </div>
        {!isIntro && !isDone && (
          <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.6)" }}>{idx+1}/{steps.length}</div>
        )}
      </div>

      {/* Progress bar interattiva */}
      <ProgressBar/>

      {/* Content — tap sinistra: indietro · tap destra: avanti */}
      <div onClick={handleTap} style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"24px 28px", cursor:"pointer", overflowY:"auto", position:"relative" }}>
        {isIntro ? (
          <div>
            <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:2, color:th.appAccent2, textTransform:"uppercase", marginBottom:12 }}>Prima di iniziare — ingredienti</div>

            <div style={{
              background:"rgba(255,255,255,0.08)",
              border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:12, padding:"10px 14px", marginBottom:16,
              fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.5,
            }}>
              {scaled ? (
                <>
                  Dosi ricalcolate: <b>{scale?.label}</b>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:3 }}>
                    tra parentesi trovi le dosi originali
                  </div>
                </>
              ) : (
                <>Dosi originali: <b>{baseServings} porzioni</b> (nessuna conversione)</>
              )}
            </div>

            {ingredients.map((ing, i) => (
              <div key={i} style={{ fontFamily:F.body, fontSize:16, lineHeight:1.5, padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.9)" }}>
                {ing.scaled}
                {scaled && ing.original !== ing.scaled && (
                  <span style={{ color:"rgba(255,255,255,0.45)", fontSize:13, fontStyle:"italic" }}> ({ing.original})</span>
                )}
              </div>
            ))}
            <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:20, textAlign:"center" }}>tocca a destra per iniziare →</div>
            <div style={{ fontFamily:F.ui, fontSize:10.5, color:"rgba(255,255,255,0.3)", marginTop:6, textAlign:"center", lineHeight:1.6 }}>
              ‹ tocca a sinistra per tornare indietro · tocca a destra per avanzare ›
            </div>
          </div>
        ) : isDone ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
            <div style={{ fontFamily:F.display, fontSize:26, fontStyle:"italic", marginBottom:8 }}>Buon appetito!</div>
            <div style={{ fontFamily:F.ui, fontSize:13, color:"rgba(255,255,255,0.5)" }}>tocca per chiudere</div>
          </div>
        ) : (
          <div>
            {step.section && (
              <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:2, color:th.appAccent2, textTransform:"uppercase", marginBottom:10 }}>{step.section}</div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
              <div style={{ minWidth:44, height:44, padding:"0 8px", borderRadius:22, background:th.appAccent, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.ui, fontSize:18, fontWeight:700, flexShrink:0 }}>{stepNumberLabel(step.sectionIndex, step.indexInSection)}</div>
              {step.photos && step.photos.length > 0 && (
                <div style={{ display:"flex", gap:8, overflowX:"auto" }}>
                  {step.photos.map((photo, pi) => (
                    <img
                      key={pi}
                      src={photo}
                      alt=""
                      onClick={(e) => { e.stopPropagation(); setLightbox({ photo, caption:step.text, date:"", isImage:true }); }}
                      style={{ width:60, height:60, objectFit:"cover", borderRadius:10, flexShrink:0, cursor:"pointer" }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontFamily:F.body, fontSize:22, lineHeight:1.6, color:"rgba(255,255,255,0.95)" }}>{step.text}</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:28, textAlign:"center", lineHeight:1.6 }}>
              ‹ sinistra: indietro · destra: avanti ›
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {!isDone && (
        <div style={{ display:"flex", flexShrink:0, borderTop:"1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={isIntro} style={{ flex:1, padding:"16px", background:"none", border:"none", color: isIntro ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)", fontFamily:F.ui, fontSize:14, cursor: isIntro ? "default" : "pointer", borderRight:"1px solid rgba(255,255,255,0.1)" }}>‹ Indietro</button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ flex:1, padding:"16px", background:"none", border:"none", color:th.appAccent2, fontFamily:F.ui, fontSize:14, fontWeight:700, cursor:"pointer" }}>{isIntro ? "Inizia →" : idx === steps.length-1 ? "Fine ✓" : "Avanti ›"}</button>
        </div>
      )}

      {lightbox && (
        <PhotoLightbox
          photo={lightbox.photo}
          caption={lightbox.caption}
          date={lightbox.date}
          isImage={lightbox.isImage}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
