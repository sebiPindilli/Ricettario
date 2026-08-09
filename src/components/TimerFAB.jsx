import { useState } from "react";
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

// ── FAB dei timer di cucina — angolo opposto a BetaButton (basso a
// sinistra). Sempre visibile (come BetaButton): è l'unico punto d'accesso
// al popup, quindi deve restare cliccabile anche a zero timer attivi,
// altrimenti non ci sarebbe modo di avviarne uno standalone. Non è
// trascinabile (a differenza di BetaButton) perché non copre mai controlli
// sottostanti in quell'angolo.
export default function TimerFAB() {
  const th = useTheme();
  const { timers, now, prefs } = useCookingTimers();
  const [open, setOpen] = useState(false);

  const anyExpired = timers.some(t => isExpired(t, now));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TIMER_FAB_RESPONSIVE_CSS }} />
      <button
        className={`timer-fab-button${anyExpired && prefs.visual ? " timer-fab-pulse" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Timer di cucina"
        style={{
          position: "absolute", bottom: MARGIN, left: MARGIN, zIndex: 150,
          width: BTN_SIZE, height: BTN_SIZE, borderRadius: "50%",
          border: "none", background: anyExpired ? "#C0524A" : th.appAccent, color: "#fff",
          fontFamily: F.display, fontSize: 20, fontWeight: 700,
          boxShadow: "0 6px 16px rgba(0,0,0,0.3)", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1,
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
