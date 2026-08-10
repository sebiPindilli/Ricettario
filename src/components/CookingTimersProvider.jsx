import { useState, useEffect, useCallback, useRef } from "react";
import { CookingTimersCtx } from "../context.js";
import { uid } from "../utils/helpers.js";
import { isExpired } from "../utils/timers.js";
import { setTimerAlertPrefs, DEFAULT_TIMER_ALERTS } from "../services/authStore.js";

// Ogni quanto ripetere l'avviso di un timer scaduto non ancora confermato,
// e per quanto tempo insistere prima di arrendersi (il timer resta comunque
// visibile come scaduto, richiede solo più l'utente per essere chiuso —
// evita un allarme che squilla all'infinito se nessuno risponde).
const ALERT_REPEAT_MS = 15_000;
const ALERT_MAX_DURATION_MS = 5 * 60_000;

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
    setTimers(prev => [...prev, { id, label: label || "Timer", minutes, endAt: Date.now() + minutes * 60000, lastAlertAt: null }]);
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
  // ensureAudioCtx() (non solo playBeep) ad ogni chiamata: su una finestra
  // di ripetizione di alcuni minuti è plausibile che il browser sospenda
  // l'AudioContext (scheda in background) tra uno squillo e il successivo —
  // senza ri-eseguire il resume qui, i bip successivi al primo resterebbero
  // muti in silenzio.
  const fireAlert = useCallback(() => {
    const p = prefsRef.current;
    if (p.sound) { ensureAudioCtx(); playBeep(); }
    if (p.vibrate && "vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
  }, [playBeep, ensureAudioCtx]);

  // Controlla le scadenze rispetto a "adesso": emette l'avviso al primo
  // superamento di endAt e poi lo ripete ogni ALERT_REPEAT_MS finché il
  // timer non viene chiuso (cancelTimer) o non supera ALERT_MAX_DURATION_MS
  // dalla scadenza. Un solo fireAlert() per tick anche se più timer sono
  // "dovuti" insieme — un singolo bip+vibrazione basta a segnalare "c'è
  // qualcosa che aspetta", niente cacofonia proporzionale al numero di
  // timer scaduti in contemporanea.
  const checkExpirations = useCallback(() => {
    const at = Date.now();
    setNow(at);
    const due = timersRef.current.filter(t =>
      isExpired(t, at) &&
      (at - t.endAt) < ALERT_MAX_DURATION_MS &&
      (t.lastAlertAt === null || at - t.lastAlertAt >= ALERT_REPEAT_MS)
    );
    if (due.length === 0) return;
    fireAlert();
    setTimers(prev => prev.map(t => due.some(d => d.id === t.id) ? { ...t, lastAlertAt: at } : t));
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
