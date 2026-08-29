import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useTheme, useCookingTimers, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import { flattenSteps, flattenIngredients, ingredientToText, scaleIngredient, stepNumberLabel } from "../utils/helpers.js";
import { remainingMs, isExpired, formatRemaining, formatOverdue } from "../utils/timers.js";
import PhotoLightbox from "../components/PhotoLightbox.jsx";
import InfoButton from "../components/InfoButton.jsx";
import TimersPopup from "../components/TimersPopup.jsx";
import TimerFAB from "../components/TimerFAB.jsx";
import { guideCucina } from "../data/guideContent.jsx";

// ══════════════════════════════════════════════════════════════
// MODALITÀ CUCINA — step by step a schermo intero, tap per avanzare
// ══════════════════════════════════════════════════════════════
export default function CookingMode({ recipe, scale, onClose }) {
  const th = useTheme();
  const ui = useUiStyle();
  const { setCookingModeActive, timers, now } = useCookingTimers();

  // Flag globale letto da TopStack.jsx (nasconde la barra timer, che ha
  // senso solo FUORI da qui, dove questa schermata ha il proprio FAB
  // dedicato) — vive nel ciclo di vita di questo componente, non nei suoi
  // due punti di mount (RecipeScreen.jsx/EmptyFridgeScreen.jsx).
  useEffect(() => {
    setCookingModeActive(true);
    return () => setCookingModeActive(false);
  }, [setCookingModeActive]);
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
  // Popup timer per-step — invariato: precompila etichetta/minuti dal
  // pulsante "▶ Timer X min" di uno step. Il FAB dedicato (sotto) gestisce
  // il proprio TimersPopup standalone in autonomia.
  const [timerPopup, setTimerPopup] = useState(null);
  const navRef = useRef(null);
  const [navHeight, setNavHeight] = useState(0);

  // Wake Lock — schermo acceso per tutta la Modalità Cucina, anche a mani
  // impastate lontane dal telefono. No-op silenzioso se l'API non esiste
  // (Safari desktop, browser datati): niente controllo visibile che non
  // funzionerebbe comunque. Il sistema operativo rilascia da solo il lock
  // quando la scheda va in background — si riacquisisce al rientro in
  // primo piano finché si è ancora su questa schermata (il cleanup
  // dell'effetto, all'unmount, si occupa del rilascio all'uscita).
  const wakeLockRef = useRef(null);
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    const acquire = async () => {
      try { wakeLockRef.current = await navigator.wakeLock.request("screen"); }
      catch { /* negato o schermo non visibile al momento della richiesta: si riprova al prossimo rientro in foreground */ }
    };
    acquire();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);

  const isIntro = idx === -1;
  const isDone = idx >= steps.length;
  const step = steps[idx];

  // Altezza reale della bottom nav — il FAB dedicato ai timer (sotto) deve
  // restare sollevato sopra di essa senza coprirne i tap. Rimisurata ad ogni
  // cambio di isDone (la nav sparisce del tutto sulla schermata finale) e,
  // come rete di sicurezza, via ResizeObserver — che in alcuni ambienti non
  // scatta in modo affidabile (vedi TopStack.jsx), quindi non ci si affida
  // SOLO a lui.
  useLayoutEffect(() => {
    setNavHeight(navRef.current ? navRef.current.offsetHeight : 0);
  }, [isDone]);
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNavHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [isDone]);

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
              // "fatto" (appAccent2) solo nei nuovi stili — in classico la
              // barra a pastiglie resta identica a prima (nessun passo si
              // distingue per "già visto").
              const done = ui.id !== "classico" && it.globalIdx < idx;
              const label = stepNumberLabel(it.sectionIndex, it.indexInSection);
              return (
                <button
                  key={it.globalIdx}
                  onClick={() => goTo(it.globalIdx)}
                  title={`Passo ${label}`}
                  style={{
                    minWidth:30, height:30, padding:"0 6px", borderRadius:15, flexShrink:0, cursor:"pointer",
                    border: active || done ? `2px solid ${th.appAccent2}` : "2px solid rgba(255,255,255,0.2)",
                    background: active ? th.appAccent : done ? `${th.appAccent2}33` : "rgba(255,255,255,0.08)",
                    color: done && !active ? th.appAccent2 : "#fff", fontFamily:F.ui, fontSize:12, fontWeight:700,
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
    <div className="cooking-mode-shell" style={{ position:"fixed", inset:0, zIndex:400, background:th.appInk, display:"flex", flexDirection:"column", color:"#fff" }}>
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
        <InfoButton dark>{guideCucina}</InfoButton>
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
            {step.duration != null && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTimerPopup({ label: `Passo ${stepNumberLabel(step.sectionIndex, step.indexInSection)}`, minutes: step.duration });
                }}
                style={{
                  marginTop:18, display:"flex", alignItems:"center", gap:8, background:th.appAccent, border:"none",
                  borderRadius:10, padding:"10px 16px", color:"#fff", fontFamily:F.ui, fontSize:14, fontWeight:700, cursor:"pointer",
                }}
              >▶ Timer {step.duration} min</button>
            )}
            <div style={{ fontFamily:F.ui, fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:28, textAlign:"center", lineHeight:1.6 }}>
              ‹ sinistra: indietro · destra: avanti ›
            </div>
          </div>
        )}
      </div>

      {/* Timer attivo — negli stili nuovi il FAB sparisce: una striscia
          sottile sopra la barra Indietro/Avanti, col conto alla rovescia
          (DECISIONI.md §Timer / IMPLEMENTATION_PLAN Fase 7). Stesso
          TimersPopup di sempre, nessuna logica di stato timer nuova. */}
      {ui.timer === "strip" && (() => {
        const anyExpired = timers.some(t => isExpired(t, now));
        // Nessun timer attivo: la striscia resta comunque il solo modo per
        // aprirne uno in questo stile (il FAB, sempre disponibile, sparisce
        // qui) — stesso accesso di prima, presentazione diversa.
        const text = timers.length === 0 ? "Timer" : timers.map(t => {
          const rem = remainingMs(t, now);
          const expired = isExpired(t, now);
          return `${t.label} — ${expired ? formatOverdue(-rem) : formatRemaining(rem)}`;
        }).join("   ·   ");
        return (
          <button onClick={() => setTimerPopup({})} style={{
            display:"flex", alignItems:"center", gap:8, width:"100%",
            padding:"7px 16px", flexShrink:0, border:"none", borderTop:"1px solid rgba(255,255,255,0.1)",
            background: anyExpired ? "#C0524A" : "rgba(255,255,255,0.06)",
            color:"#fff", fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
            textAlign:"left", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>
            <span style={{ flexShrink:0 }}>⏱</span>
            <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{text}</span>
          </button>
        );
      })()}

      {/* Bottom nav */}
      {!isDone && (
        <div ref={navRef} style={{ display:"flex", flexShrink:0, borderTop:"1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={isIntro} style={{ flex:1, padding:"16px", background:"none", border:"none", color: isIntro ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)", fontFamily:F.ui, fontSize:14, cursor: isIntro ? "default" : "pointer", borderRight:"1px solid rgba(255,255,255,0.1)" }}>‹ Indietro</button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ flex:1, padding:"16px", background:"none", border:"none", color:th.appAccent2, fontFamily:F.ui, fontSize:14, fontWeight:700, cursor:"pointer" }}>{isIntro ? "Inizia →" : idx === steps.length-1 ? "Fine ✓" : "Avanti ›"}</button>
        </div>
      )}

      {ui.timer !== "strip" && (
        <TimerFAB anchorSelector=".cooking-mode-shell" bottomOffset={isDone ? 20 : (navHeight || 56) + 20} />
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

      {timerPopup && (
        <TimersPopup
          initialDraft={timerPopup.minutes != null ? timerPopup : null}
          onClose={() => setTimerPopup(null)}
        />
      )}
    </div>
  );
}
