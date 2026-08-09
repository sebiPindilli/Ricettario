// ══════════════════════════════════════════════════════════════
// Timer di cucina — funzioni pure, nessun React qui dentro.
// Un timer è { id, label, minutes, endAt, alerted }. endAt è un timestamp
// ASSOLUTO (Date.now() + minutes*60000), mai un contatore che scende: il
// browser sospende il JS quando l'app va in background o lo schermo si
// spegne — con un contatore il tempo si perderebbe, con una scadenza
// assoluta basta confrontarla con l'ora corrente al rientro in foreground
// per mostrare lo stato corretto, incluso "scaduto N minuti fa".
// ══════════════════════════════════════════════════════════════

export const remainingMs = (timer, now) => timer.endAt - now;
export const isExpired = (timer, now) => remainingMs(timer, now) <= 0;

const pad2 = (n) => String(n).padStart(2, "0");

// Tempo rimanente positivo → "mm:ss", o "h:mm:ss" oltre l'ora.
export const formatRemaining = (ms) => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
};

// Da quanto tempo un timer è scaduto ("scaduto 4 min fa") — è il modo in
// cui una scadenza assoluta resta corretta anche dopo una sospensione
// prolungata dell'app (a differenza di un contatore, che si sarebbe
// fermato senza saperlo).
export const formatOverdue = (overdueMs) => {
  const totalMin = Math.floor(overdueMs / 60000);
  if (totalMin < 1) return "scaduto ora";
  if (totalMin === 1) return "scaduto 1 min fa";
  if (totalMin < 60) return `scaduto ${totalMin} min fa`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `scaduto ${h}h${m > 0 ? ` ${m}min` : ""} fa`;
};
