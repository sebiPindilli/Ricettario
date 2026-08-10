import { useRef, useLayoutEffect } from "react";
import { useCookingTimers } from "../context.js";

// ── Stack condiviso in cima allo schermo — oggi solo il banner offline
// (spostato qui identico, nessun cambio di comportamento), in futuro
// anche la barra timer (fuori dalla Modalità Cucina). Un solo
// ResizeObserver sul wrapper misura l'altezza TOTALE (0, 1 o 2 elementi)
// e la scrive in topStackHeight, letta da GlobalNav.jsx per posizionarsi
// sempre sotto invece di sovrapporsi (bug preesistente: prima il banner,
// zIndex 9999, copriva GlobalNav, zIndex 100, senza spingerlo giù).
export default function TopStack({ isOnline }) {
  const { setTopStackHeight } = useCookingTimers();
  const wrapRef = useRef(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setTopStackHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { ro.disconnect(); setTopStackHeight(0); };
  }, [setTopStackHeight]);

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
