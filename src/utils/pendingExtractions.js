// ── Estrazioni AI aperte nell'editor ma non ancora salvate ──────────────
// Persistite in localStorage (sopravvivono a reload e chiusura app) così
// un'estrazione costata una chiamata a Gemini non sparisce nel nulla se
// l'utente tocca "indietro" invece di "salva". Scadono da sole dopo 30
// giorni dalla creazione, per non accumulare bozze dimenticate.
const STORAGE_KEY = "ricettario:pendingExtractions";
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function readAll() {
  let list;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Lettura bozze non riuscita, nessuna bozza disponibile", e);
    return [];
  }
  if (!Array.isArray(list)) return [];
  const fresh = list.filter(p => Date.now() - p.createdAt < EXPIRY_MS);
  if (fresh.length !== list.length) writeAll(fresh);
  return fresh;
}

function writeAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Salvataggio bozze non riuscito", e);
  }
}

export function listPendingExtractions() {
  return readAll();
}

// Crea o aggiorna (stesso id = stessa bozza riaperta) — createdAt resta
// quello della prima volta, la scadenza non si allunga solo perché la si
// riapre.
export function savePendingExtraction(id, draft) {
  const list = readAll();
  const existing = list.find(p => p.id === id);
  const createdAt = existing ? existing.createdAt : Date.now();
  writeAll([{ id, draft, createdAt }, ...list.filter(p => p.id !== id)]);
}

export function removePendingExtraction(id) {
  writeAll(readAll().filter(p => p.id !== id));
}
