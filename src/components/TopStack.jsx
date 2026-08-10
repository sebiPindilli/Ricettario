import { useRef, useLayoutEffect } from "react";
import { useCookingTimers } from "../context.js";
import CookingTimerBar from "./CookingTimerBar.jsx";

// ── Stack condiviso in cima allo schermo — banner offline e, fuori dalla
// Modalità Cucina, la barra timer (nulla se non ci sono timer attivi:
// dentro la Modalità Cucina c'è il FAB dedicato, qui fuori l'accesso è
// solo se già c'è qualcosa da mostrare). L'altezza TOTALE viene scritta in
// topStackHeight, letta da GlobalNav.jsx per posizionarsi sempre sotto
// invece di sovrapporsi (bug preesistente: prima il banner, zIndex 9999,
// copriva GlobalNav, zIndex 100, senza spingerlo giù).
export default function TopStack({ isOnline }) {
  const { setTopStackHeight, timers, cookingModeActive } = useCookingTimers();
  const wrapRef = useRef(null);
  const showTimerBar = timers.length > 0 && !cookingModeActive;

  // ResizeObserver come rete di sicurezza per variazioni di altezza NON
  // legate a isOnline/showTimerBar (es. il testo della barra timer che
  // passa da fermo a scorrevole) — montato una sola volta.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTopStackHeight(el.offsetHeight));
    ro.observe(el);
    return () => { ro.disconnect(); setTopStackHeight(0); };
  }, [setTopStackHeight]);

  // Rimisura SINCRONA ad ogni cambio che fa apparire/sparire un elemento
  // dello stack — non ci si affida solo alla ResizeObserver (la cui
  // tempistica non è garantita, e in alcuni contesti — es. una scheda non
  // "visibile" al compositor del browser — può non scattare affatto).
  useLayoutEffect(() => {
    if (wrapRef.current) setTopStackHeight(wrapRef.current.offsetHeight);
  }, [isOnline, showTimerBar, setTopStackHeight]);

  return (
    <div ref={wrapRef} style={{ position:"fixed", top:0, left:0, right:0, zIndex:9999 }}>
      {!isOnline && (
        <div style={{
          background:"#B8973A", color:"#fff", textAlign:"center",
          fontFamily:"sans-serif", fontSize:11, padding:"5px 10px",
        }}>
          Sei offline — le modifiche verranno salvate alla riconnessione
        </div>
      )}
      {showTimerBar && <CookingTimerBar/>}
    </div>
  );
}
