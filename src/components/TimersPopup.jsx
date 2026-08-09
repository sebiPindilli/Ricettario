import { useState } from "react";
import { useTheme, useCookingTimers } from "../context.js";
import { F } from "../data/constants.js";
import { remainingMs, isExpired, formatRemaining, formatOverdue } from "../utils/timers.js";

const smallBtnStyle = (th, color) => ({
  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
  border: `1.5px solid ${color || th.appBorder}`,
  background: "transparent", color: color || th.appInk,
  fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer",
});

const PULSE_CSS = `
  @keyframes timerPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(192,82,74,0.5); } 50% { box-shadow: 0 0 0 6px rgba(192,82,74,0); } }
  .timer-pulse { animation: timerPulse 1.2s ease-in-out infinite; }
`;

const canVibrate = "vibrate" in navigator;

const toggleBtnStyle = (th, active) => ({
  display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8,
  border: `1.5px solid ${active ? th.appAccent : th.appBorder}`,
  background: active ? `${th.appAccent}22` : "transparent",
  color: active ? th.appAccent : th.appFaded,
  fontFamily: F.ui, fontSize: 11, fontWeight: 700, cursor: "pointer",
});

// ── Popup timer — stesso schema a 3 parti di ShoppingMode.jsx: header
// scuro con conteggio, lista scrollabile, footer con l'azione "+ nuovo
// timer". Raccoglie sia i timer legati a uno step (initialDraft precompila
// etichetta/minuti, regolabili prima di avviare) sia quelli standalone.
// zIndex più alto di CookingMode/ShoppingMode (400) per potersi aprire
// sopra la Modalità Cucina stessa.
export default function TimersPopup({ onClose, initialDraft = null }) {
  const th = useTheme();
  const { timers, now, startTimer, cancelTimer, adjustTimer, prefs, updatePrefs } = useCookingTimers();
  const [draftLabel, setDraftLabel] = useState(initialDraft?.label || "");
  const [draftMinutes, setDraftMinutes] = useState(initialDraft?.minutes ?? 5);

  const handleStart = () => {
    if (!(draftMinutes > 0)) return;
    startTimer(draftLabel.trim(), draftMinutes);
    setDraftLabel("");
    setDraftMinutes(5);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style dangerouslySetInnerHTML={{ __html: PULSE_CSS }} />
      <div style={{ width: "100%", maxHeight: "90%", background: th.appBg, borderRadius: 20, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: th.appInk, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 14, cursor: "pointer" }}>✕</button>
          <div style={{ flex: 1, fontFamily: F.display, fontSize: 15, color: "#fff", fontStyle: "italic" }}>⏱ Timer</div>
          <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{timers.length}</div>
        </div>

        {/* Preferenze avviso — combinabili, co-locate con ciò che controllano */}
        <div style={{ display: "flex", gap: 6, padding: "10px 18px", borderBottom: `1px solid ${th.appBorder}`, flexShrink: 0 }}>
          <button onClick={() => updatePrefs({ sound: !prefs.sound })} style={toggleBtnStyle(th, prefs.sound)}>🔊 Suono</button>
          {canVibrate && (
            <button onClick={() => updatePrefs({ vibrate: !prefs.vibrate })} style={toggleBtnStyle(th, prefs.vibrate)}>📳 Vibrazione</button>
          )}
          <button onClick={() => updatePrefs({ visual: !prefs.visual })} style={toggleBtnStyle(th, prefs.visual)}>💡 Visivo</button>
        </div>

        {/* Lista timer attivi */}
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "12px 18px" }}>
          {timers.length === 0 && (
            <div style={{ textAlign: "center", color: th.appFaded, fontFamily: F.ui, fontSize: 12, padding: "20px 0" }}>Nessun timer attivo</div>
          )}
          {timers.map(t => {
            const rem = remainingMs(t, now);
            const expired = isExpired(t, now);
            return (
              <div key={t.id} className={expired && prefs.visual ? "timer-pulse" : undefined} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 8,
                borderRadius: 12, border: `1.5px solid ${expired ? "#C0524A" : th.appBorder}`,
                background: expired ? "#C0524A18" : th.appCard,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: th.appInk, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</div>
                  <div style={{ fontFamily: F.display, fontSize: 18, color: expired ? "#C0524A" : th.appAccent }}>
                    {expired ? formatOverdue(-rem) : formatRemaining(rem)}
                  </div>
                </div>
                {!expired && (
                  <>
                    <button onClick={() => adjustTimer(t.id, -1)} title="-1 minuto" style={smallBtnStyle(th)}>−1</button>
                    <button onClick={() => adjustTimer(t.id, 1)} title="+1 minuto" style={smallBtnStyle(th)}>+1</button>
                  </>
                )}
                <button onClick={() => cancelTimer(t.id)} title={expired ? "Chiudi" : "Annulla"} style={smallBtnStyle(th, "#C0524A")}>{expired ? "OK" : "✕"}</button>
              </div>
            );
          })}
        </div>

        {/* Nuovo timer — non legato a nessuno step */}
        <div style={{ flexShrink: 0, padding: "14px 18px 18px", borderTop: `1px solid ${th.appBorder}`, display: "flex", gap: 8 }}>
          <input
            value={draftLabel}
            onChange={e => setDraftLabel(e.target.value)}
            placeholder="Etichetta (opzionale)"
            style={{ flex: 1, minWidth: 0, padding: "10px 12px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: th.appCard, fontFamily: F.body, fontSize: 13, color: th.appInk, outline: "none" }}
          />
          <input
            type="number" min="1" inputMode="numeric"
            value={draftMinutes}
            onChange={e => setDraftMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
            style={{ width: 56, flexShrink: 0, padding: "10px 8px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: th.appCard, fontFamily: F.ui, fontSize: 13, color: th.appInk, outline: "none" }}
          />
          <button onClick={handleStart} style={{ flexShrink: 0, padding: "10px 16px", border: "none", borderRadius: 10, background: th.appAccent, color: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>▶ Avvia</button>
        </div>
      </div>
    </div>
  );
}
