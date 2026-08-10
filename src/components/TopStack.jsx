import { useRef, useLayoutEffect } from "react";
import { useCookingTimers } from "../context.js";

// ── Stack condiviso in cima allo schermo — oggi solo il banner offline
// (spostato qui identico, nessun cambio di comportamento), in futuro
// anche la barra timer (fuori dalla Modalità Cucina). L'altezza TOTALE
// (0, 1 o 2 elementi) viene scritta in topStackHeight, letta da
// GlobalNav.jsx per posizionarsi sempre sotto invece di sovrapporsi (bug
// preesistente: prima il banner, zIndex 9999, copriva GlobalNav, zIndex
// 100, senza spingerlo giù).
export default function TopStack({ isOnline }) {
  const { setTopStackHeight } = useCookingTimers();
  const wrapRef = useRef(null);

  // ResizeObserver come rete di sicurezza per variazioni di altezza NON
  // legate a isOnline (es. testo della futura barra timer che va a capo
  // in modo diverso) — montato una sola volta.
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
  }, [isOnline, setTopStackHeight]);

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
    </div>
  );
}
