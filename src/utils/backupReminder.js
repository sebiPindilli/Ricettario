// ── Promemoria di backup locale ──────────────────────────────────────────
// Il backup è un download manuale (vedi ricettario-v23.jsx,
// downloadLocalBackup): senza tracciarne la data da qualche parte, l'utente
// non avrebbe modo di sapere se il suo ultimo backup è recente o di mesi
// fa. Tenuto in localStorage (per-dispositivo, non è un dato del libro).
const STORAGE_KEY = "ricettario:lastBackupAt";
const REMIND_AFTER_MS = 30 * 24 * 60 * 60 * 1000; // 30 giorni

export function markBackupDone() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch (e) {
    console.warn("Salvataggio data ultimo backup non riuscito", e);
  }
}

export function getLastBackupAt() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

// true se non è mai stato fatto un backup su questo dispositivo, o se
// l'ultimo risale a più di REMIND_AFTER_MS fa.
export function shouldRemindBackup() {
  const last = getLastBackupAt();
  return last == null || Date.now() - last > REMIND_AFTER_MS;
}
