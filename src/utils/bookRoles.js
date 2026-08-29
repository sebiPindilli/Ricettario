// ══════════════════════════════════════════════════════════════
// MODELLO DI RUOLO PER-LIBRO — fonte di verità unica, usata sia
// dall'endpoint /api/manage-book-member (Admin SDK) sia dalla UI
// client. Le Firestore rules NON possono importare questo file (è
// un linguaggio a parte): la sola parte che devono replicare è
// EDITOR_ROLES/LEGACY_ALIASES, tenuta volutamente piccola per
// questo motivo — vedi il commento in firestore.rules dove viene
// specchiata, e tests/firestore.rules.test.js che verifica che le
// due versioni non divergano.
//
// "proprietario" non vive mai in meta.memberRoles (è meta.owner) —
// qui viene comunque trattato come un valore di ruolo a tutti gli
// effetti, per non dover fare eccezioni in ogni funzione.
// ══════════════════════════════════════════════════════════════

export const ROLES = ["proprietario", "collaboratore", "redattore", "lettore"];

// Alias legacy dallo schema a due livelli (edit/read) — mai riscritti nei
// documenti esistenti, solo interpretati a runtime ovunque un ruolo venga
// letto. "edit" copriva sia collaboratore sia redattore prima di questa
// migrazione: si mappa su redattore, il livello più permissivo dei due
// senza poteri di gestione membri (nessuno diventa collaboratore da solo).
const LEGACY_ALIASES = { edit: "redattore", read: "lettore" };
export const normalizeRole = (raw) => LEGACY_ALIASES[raw] || raw;

// Ruolo per esteso, tre sole varianti (IMPLEMENTATION_PLAN Fase 10/11):
// collaboratore e redattore collassano nella stessa frase — la UI non
// distingue qui "può gestire i membri" da "può solo modificare le ricette",
// solo isEditorRole/lettore contano a questo livello di dettaglio.
const ROLE_LABELS_LONG = { proprietario: "Proprietario", collaboratore: "Puoi modificare", redattore: "Puoi modificare", lettore: "Sola lettura" };
export const roleLabelLong = (raw) => ROLE_LABELS_LONG[normalizeRole(raw)] || normalizeRole(raw);

// Ruoli che possono scrivere contenuti (ricette, Organizza, tag, sezioni).
// Il lettore è l'unico realmente limitato in scrittura.
export const EDITOR_ROLES = ["proprietario", "collaboratore", "redattore"];
export const isEditorRole = (role) => EDITOR_ROLES.includes(normalizeRole(role));

// Ruoli che possono eliminare ricette o ricordi — azioni distruttive e
// irreversibili, riservate a chi è "di fiducia" quanto il proprietario.
export const DELETER_ROLES = ["proprietario", "collaboratore"];
export const canDelete = (role) => DELETER_ROLES.includes(normalizeRole(role));

export const MAX_MEMBERS = 20; // proprietario incluso

// memberEmailsLength = lunghezza attuale di meta.memberEmails (il
// proprietario NON è in quell'array, va contato a parte).
export const canAddMember = (memberEmailsLength) => memberEmailsLength + 1 < MAX_MEMBERS;

// Ruoli che l'attore può assegnare (in invito o cambio ruolo) — usato dalla
// UI per mostrare solo le pillole pertinenti, e specchiato dalla logica di
// canAssignRole qui sotto per la vera applicazione lato server.
export function assignableRoles(actorRole) {
  const actor = normalizeRole(actorRole);
  if (actor === "proprietario") return ["collaboratore", "redattore", "lettore"];
  if (actor === "collaboratore") return ["redattore", "lettore"];
  return [];
}

// Può l'attore assegnare newRole a un membro che oggi ha targetRole?
// targetRole === null significa "non è ancora membro" (invito).
export function canAssignRole(actorRole, targetRole, newRole, { actorEmail, targetEmail } = {}) {
  if (actorEmail && targetEmail && actorEmail === targetEmail) return false; // nessuna auto-promozione
  const actor = normalizeRole(actorRole);
  const next = normalizeRole(newRole);
  const target = targetRole == null ? null : normalizeRole(targetRole);

  if (actor === "proprietario") {
    return next !== "proprietario"; // può tutto tranne creare un secondo proprietario
  }
  if (actor === "collaboratore") {
    if (next === "proprietario" || next === "collaboratore") return false; // mai crea/promuove un collaboratore
    if (target === "proprietario" || target === "collaboratore") return false; // mai tocca chi è già a quel livello
    return next === "redattore" || next === "lettore";
  }
  return false; // redattore e lettore non gestiscono mai membri
}

// Può l'attore rimuovere un membro che oggi ha targetRole?
export function canRemoveMember(actorRole, targetRole, { actorEmail, targetEmail } = {}) {
  if (actorEmail && targetEmail && actorEmail === targetEmail) return false;
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);
  if (actor === "proprietario") return true;
  if (actor === "collaboratore") return target === "redattore" || target === "lettore";
  return false;
}
