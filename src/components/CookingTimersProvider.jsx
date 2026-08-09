import { useState, useEffect, useCallback } from "react";
import { CookingTimersCtx } from "../context.js";
import { uid } from "../utils/helpers.js";
import { isExpired } from "../utils/timers.js";

// ── Provider dei timer di cucina ──────────────────────────────────
// Monta qui lo stato (non nei singoli screen): AppInner/IPhone non si
// smontano mai al cambio di `screen`, quindi un timer avviato durante la
// Modalità Cucina continua a correre anche uscendo da quella schermata —
// si perde solo alla chiusura vera dell'app, come richiesto (nessuna
// persistenza su Firestore o storage locale).
export default function CookingTimersProvider({ children, onExpire }) {
  const [timers, setTimers] = useState([]);
  const [now, setNow] = useState(() => Date.now());

  const startTimer = useCallback((label, minutes) => {
    const id = uid("timer");
    setTimers(prev => [...prev, { id, label: label || "Timer", minutes, endAt: Date.now() + minutes * 60000, alerted: false }]);
    return id;
  }, []);

  const cancelTimer = useCallback((id) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sposta la scadenza di un timer già avviato (± minuti) — mai il campo
  // duration della ricetta, che questo provider non tocca mai: vale solo
  // per la sessione corrente, esattamente come richiesto.
  const adjustTimer = useCallback((id, deltaMin) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, endAt: t.endAt + deltaMin * 60000 } : t));
  }, []);

  // Controlla le scadenze rispetto a "adesso": emette l'avviso una sola
  // volta per timer (flag alerted), ma non lo rimuove dalla lista — resta
  // visibile come scaduto ("scaduto N fa") finché l'utente non lo chiude,
  // anche se la scadenza è avvenuta mentre l'app era in background.
  const checkExpirations = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setTimers(prev => {
      let changed = false;
      const next = prev.map(t => {
        if (!t.alerted && isExpired(t, at)) {
          changed = true;
          onExpire && onExpire(t);
          return { ...t, alerted: true };
        }
        return t;
      });
      return changed ? next : prev;
    });
  }, [onExpire]);

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

  const value = { timers, now, startTimer, cancelTimer, adjustTimer };
  return <CookingTimersCtx.Provider value={value}>{children}</CookingTimersCtx.Provider>;
}
