import { useState, useEffect, useCallback, useRef } from "react";
import { CookingTimersCtx } from "../context.js";
import { uid } from "../utils/helpers.js";
import { isExpired } from "../utils/timers.js";
import { setTimerAlertPrefs, DEFAULT_TIMER_ALERTS } from "../services/authStore.js";

// ── Provider dei timer di cucina ──────────────────────────────────
// Monta qui lo stato (non nei singoli screen): AppInner/IPhone non si
// smontano mai al cambio di `screen`, quindi un timer avviato durante la
// Modalità Cucina continua a correre anche uscendo da quella schermata —
// si perde solo alla chiusura vera dell'app, come richiesto (nessuna
// persistenza su Firestore o storage locale). Le PREFERENZE di avviso
// invece persistono su allowlist/{email}.timerAlerts (vedi authStore.js).
export default function CookingTimersProvider({ children, me, initialPrefs }) {
  const [timers, setTimers] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  // Flag globale impostato da CookingMode.jsx (mount/unmount) — vive qui,
  // sopra il punto in cui screen alterna gli schermi, così TopStack e
  // GlobalNav possono leggerlo senza prop-drilling. Serve a nascondere la
  // barra timer mentre si è già dentro la Modalità Cucina (che ha il
  // proprio FAB dedicato).
  const [cookingModeActive, setCookingModeActive] = useState(false);
  // Altezza totale corrente dello stack in alto (banner offline + barra
  // timer, vedi TopStack.jsx) — letta da GlobalNav.jsx per posizionarsi
  // sempre sotto, mai sovrapposto.
  const [topStackHeight, setTopStackHeight] = useState(0);
  // Letto dentro checkExpirations per decidere quali timer sono "appena
  // scaduti" PRIMA di chiamare setTimers — mai dentro l'updater di
  // setTimers stesso: React (in StrictMode) può invocarlo due volte per
  // verificarne la purezza, e un effetto collaterale lì dentro (bip,
  // vibrazione) suonerebbe due volte per una sola scadenza reale.
  const timersRef = useRef(timers);
  useEffect(() => { timersRef.current = timers; }, [timers]);
  const [prefs, setPrefs] = useState(initialPrefs || DEFAULT_TIMER_ALERTS);
  // Letto dentro checkExpirations (via ref, non dipendenza di useCallback):
  // evita di dover ricreare l'intervallo di tick ogni volta che l'utente
  // cambia una preferenza mentre un timer è già in corso.
  const prefsRef = useRef(prefs);
  useEffect(() => { prefsRef.current = prefs; }, [prefs]);

  const updatePrefs = useCallback((partial) => {
    setPrefs(prev => {
      const next = { ...prev, ...partial };
      if (me) setTimerAlertPrefs(me, next);
      return next;
    });
  }, [me]);

  // Il contesto audio va creato/ripreso dentro un gesto utente per le
  // policy di autoplay dei browser — avviare un timer (click) è il gesto
  // che lo sblocca una volta per tutte, non serve altro più avanti.
  const audioCtxRef = useRef(null);
  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // Tre brevi toni (nessun asset audio da spedire) — abbastanza distinti da
  // un singolo bip per non passare inosservati con lo schermo spento.
  const playBeep = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [0, 0.3, 0.6].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.2);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.22);
    });
  }, []);

  const startTimer = useCallback((label, minutes) => {
    ensureAudioCtx();
    const id = uid("timer");
    setTimers(prev => [...prev, { id, label: label || "Timer", minutes, endAt: Date.now() + minutes * 60000, alerted: false }]);
    return id;
  }, [ensureAudioCtx]);

  const cancelTimer = useCallback((id) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sposta la scadenza di un timer già avviato (± minuti) — mai il campo
  // duration della ricetta, che questo provider non tocca mai: vale solo
  // per la sessione corrente, esattamente come richiesto.
  const adjustTimer = useCallback((id, deltaMin) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, endAt: t.endAt + deltaMin * 60000 } : t));
  }, []);

  // Suono e vibrazione secondo le preferenze correnti — l'avviso visivo
  // (bordo/lampeggio sui timer scaduti) è gestito direttamente da chi
  // legge `prefs.visual` dal context (TimerFAB/TimersPopup), non da qui.
  const fireAlert = useCallback(() => {
    const p = prefsRef.current;
    if (p.sound) playBeep();
    if (p.vibrate && "vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
  }, [playBeep]);

  // Controlla le scadenze rispetto a "adesso": emette l'avviso una sola
  // volta per timer (flag alerted), ma non lo rimuove dalla lista — resta
  // visibile come scaduto ("scaduto N fa") finché l'utente non lo chiude,
  // anche se la scadenza è avvenuta mentre l'app era in background.
  const checkExpirations = useCallback(() => {
    const at = Date.now();
    setNow(at);
    const newlyExpired = timersRef.current.filter(t => !t.alerted && isExpired(t, at));
    if (newlyExpired.length === 0) return;
    newlyExpired.forEach(fireAlert);
    setTimers(prev => prev.map(t => newlyExpired.some(e => e.id === t.id) ? { ...t, alerted: true } : t));
  }, [fireAlert]);

  // Tick di visualizzazione — un solo intervallo condiviso, attivo solo
  // quando c'è almeno un timer. La correttezza non dipende da lui (si
  // appoggia sempre a endAt vs Date.now() al momento della lettura): serve
  // solo a far scorrere il numero mentre l'app è in primo piano.
  useEffect(() => {
    if (timers.length === 0) return;
    const id = setInterval(checkExpirations, 1000);
    return () => clearInterval(id);
  }, [timers.length, checkExpirations]);

  // Al rientro in primo piano ricalcola subito, senza aspettare il
  // prossimo tick — è qui che si emettono gli avvisi rimasti arretrati
  // per i timer scaduti mentre la scheda era nascosta.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkExpirations();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [checkExpirations]);

  const value = {
    timers, now, startTimer, cancelTimer, adjustTimer, prefs, updatePrefs,
    cookingModeActive, setCookingModeActive, topStackHeight, setTopStackHeight,
  };
  return <CookingTimersCtx.Provider value={value}>{children}</CookingTimersCtx.Provider>;
}
