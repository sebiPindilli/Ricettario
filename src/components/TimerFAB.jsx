import { useState, useRef } from "react";
import { useTheme, useCookingTimers } from "../context.js";
import { F, MOBILE_BREAKPOINT_CSS } from "../data/constants.js";
import { isExpired } from "../utils/timers.js";
import TimersPopup from "./TimersPopup.jsx";

// Stesso trucco responsive di BetaButton.jsx: su desktop resta ancorato al
// mockup del telefono (position:absolute), su mobile reale passa a
// position:fixed per restare ancorato al vero viewport.
const TIMER_FAB_RESPONSIVE_CSS = `
  @media ${MOBILE_BREAKPOINT_CSS} {
    .timer-fab-button { position:fixed !important; }
  }
  @keyframes timerFabPulse { 0%, 100% { box-shadow: 0 6px 16px rgba(0,0,0,0.3), 0 0 0 0 rgba(192,82,74,0.6); } 50% { box-shadow: 0 6px 16px rgba(0,0,0,0.3), 0 0 0 8px rgba(192,82,74,0); } }
  .timer-fab-button.timer-fab-pulse { animation: timerFabPulse 1.2s ease-in-out infinite; }
`;

const BTN_SIZE = 52;
const MARGIN = 20;
const DRAG_THRESHOLD = 8; // px sotto cui il gesto resta un tap (apre il popup), non un trascinamento

// ── FAB dei timer di cucina — angolo opposto a BetaButton (basso a
// sinistra di default). Trascinabile con lo stesso schema di BetaButton.jsx
// (Pointer Events unificati mouse/touch, stato posizione mai persistito:
// torna al default a ogni montaggio). `anchorSelector`/`bottomOffset`
// permettono di riusarlo sia nel mockup generale (ancorato a .iphone-shell,
// sopra ai bottoni prev/next impliciti nel margine di default) sia dentro
// Modalità Cucina (ancorato a .cooking-mode-shell, sollevato sopra la sua
// bottom nav).
export default function TimerFAB({ anchorSelector = ".iphone-shell", bottomOffset = MARGIN }) {
  const th = useTheme();
  const { timers, now, prefs } = useCookingTimers();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null); // {top, left} px, relativi all'ancora — null = posizione di default
  const btnRef = useRef(null);
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, startY: 0, origTop: 0, origLeft: 0, shellRect: null });

  const anyExpired = timers.some(t => isExpired(t, now));

  const onPointerDown = (e) => {
    const btn = btnRef.current;
    const shell = btn?.closest(anchorSelector);
    if (!btn || !shell) return;
    const shellRect = shell.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    dragRef.current = {
      dragging: true, moved: false,
      startX: e.clientX, startY: e.clientY,
      origTop: btnRect.top - shellRect.top, origLeft: btnRect.left - shellRect.left,
      shellRect,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
    if (!d.moved) return;
    const top = Math.max(0, Math.min(d.origTop + dy, d.shellRect.height - BTN_SIZE));
    const left = Math.max(0, Math.min(d.origLeft + dx, d.shellRect.width - BTN_SIZE));
    setPos({ top, left });
  };
  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    dragRef.current.dragging = false;
  };
  const onButtonClick = () => {
    if (dragRef.current.moved) { dragRef.current.moved = false; return; } // era un trascinamento, non un tap
    setOpen(true);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TIMER_FAB_RESPONSIVE_CSS }} />
      <button
        ref={btnRef}
        className={`timer-fab-button${anyExpired && prefs.visual ? " timer-fab-pulse" : ""}`}
        onPointerDown={onPointerDown}
        onClick={onButtonClick}
        aria-label="Timer di cucina"
        style={{
          position: "absolute",
          ...(pos
            ? { top: pos.top, left: pos.left, bottom: "auto", right: "auto" }
            : { bottom: bottomOffset, left: MARGIN, top: "auto", right: "auto" }),
          zIndex: 150,
          width: BTN_SIZE, height: BTN_SIZE, borderRadius: "50%",
          border: "none", background: anyExpired ? "#C0524A" : th.appAccent, color: "#fff",
          fontFamily: F.display, fontSize: 20, fontWeight: 700,
          boxShadow: "0 6px 16px rgba(0,0,0,0.3)", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1,
          touchAction: "none",
        }}
      >
        <span>⏱</span>
        {timers.length > 0 && (
          <span style={{ fontSize: 10, fontFamily: F.ui, fontWeight: 700 }}>{timers.length}</span>
        )}
      </button>

      {open && <TimersPopup onClose={() => setOpen(false)} />}
    </>
  );
}
