import { useState, useRef, useLayoutEffect } from "react";
import { useCookingTimers } from "../context.js";
import { F } from "../data/constants.js";
import { remainingMs, isExpired, formatRemaining, formatOverdue } from "../utils/timers.js";
import TimersPopup from "./TimersPopup.jsx";

const MARQUEE_CSS = `
  @keyframes cookingTimerBarMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .cooking-timer-bar-marquee { animation-name: cookingTimerBarMarquee; animation-timing-function: linear; animation-iteration-count: infinite; }
`;

// ── Barra timer fuori dalla Modalità Cucina — visibile (montata dal
// genitore, TopStack.jsx) solo quando ci sono timer attivi. Testo
// scorrevole (marquee CSS) solo se non entra tutto nello spazio
// disponibile, altrimenti resta fermo — non ha senso far scorrere un
// testo che ci starebbe già. Tap in fondo apre lo stesso TimersPopup già
// usato ovunque, nessuna nuova logica di stato timer.
export default function CookingTimerBar() {
  const { timers, now } = useCookingTimers();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scrolling, setScrolling] = useState(false);
  const [duration, setDuration] = useState(10);

  const text = timers.map(t => {
    const rem = remainingMs(t, now);
    const expired = isExpired(t, now);
    return `${t.label} — ${expired ? formatOverdue(-rem) : formatRemaining(rem)}`;
  }).join("   ·   ");

  // Rimisura ad ogni cambio di testo (nuovo/rimosso timer, o solo il
  // countdown che cambia larghezza) — se il contenuto singolo eccede lo
  // spazio disponibile, attiva lo scorrimento (il render successivo
  // raddoppia il contenuto per il loop "translateX(-50%)").
  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const overflow = content.scrollWidth > container.clientWidth;
    setScrolling(overflow);
    if (overflow) setDuration(Math.max(8, content.scrollWidth / 40));
  }, [text]);

  return (
    <div style={{ display:"flex", alignItems:"stretch", background:"#2C2416", color:"#fff", height:30 }}>
      <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />
      <div ref={containerRef} style={{ flex:1, minWidth:0, overflow:"hidden", position:"relative" }}>
        <div
          ref={contentRef}
          className={scrolling ? "cooking-timer-bar-marquee" : undefined}
          style={{
            display:"inline-flex", alignItems:"center", height:30,
            whiteSpace:"nowrap", fontFamily:F.ui, fontSize:11, fontWeight:600,
            paddingLeft: 12,
            animationDuration: scrolling ? `${duration}s` : undefined,
          }}
        >
          <span>{text}</span>
          {scrolling && <span aria-hidden="true" style={{ paddingLeft:40 }}>{text}</span>}
        </div>
      </div>
      <button onClick={() => setOpen(true)} title="Timer" style={{
        flexShrink:0, background:"rgba(255,255,255,0.12)", border:"none",
        padding:"0 12px", color:"#fff", fontSize:14, cursor:"pointer",
      }}>⏱</button>
      {open && <TimersPopup onClose={() => setOpen(false)} />}
    </div>
  );
}
