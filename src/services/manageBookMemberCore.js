// Logica di autorizzazione per invitare/promuovere/rimuovere un membro di
// un libro — separata dal wrapper HTTP (api/manage-book-member.js) che si
// occupa solo di verificare il token e chiamare questa funzione. Separata
// così si può testare contro l'emulator Firestore con un caller già
// "verificato" (email nota), senza dover far girare anche l'Auth emulator
// solo per generare token validi.
import { FieldValue, FieldPath } from "firebase-admin/firestore";
import { normalizeRole, canAddMember, canAssignRole, canRemoveMember } from "../utils/bookRoles.js";

// db: istanza Firestore (Admin SDK, reale o puntata all'emulator).
// callerEmail: email già verificata (dal token, o da un contesto di test).
// Ritorna { status, body } — mai lancia, così l'endpoint può rispondere
// direttamente senza un try/catch per ogni ramo.
export async function applyMemberAction(db, { callerEmail, bookId, action, targetEmail: rawTargetEmail, newRole }) {
  const targetEmail = (rawTargetEmail || "").trim().toLowerCase();

  if (!bookId || !["invite", "changeRole", "remove"].includes(action)) {
    return { status: 400, body: { error: "Richiesta non valida." } };
  }
  if (!targetEmail || !targetEmail.includes("@")) {
    return { status: 400, body: { error: "Email non valida." } };
  }

  const bookRef = db.collection("books").doc(bookId);
  const bookSnap = await bookRef.get();
  if (!bookSnap.exists) {
    return { status: 404, body: { error: "Libro non trovato." } };
  }
  const meta = bookSnap.data().meta || {};
  const memberEmails = meta.memberEmails || [];
  const memberRoles = meta.memberRoles || {};

  if (targetEmail === meta.owner) {
    return { status: 403, body: { error: "Il proprietario del libro non può essere gestito da qui." } };
  }

  const actorRole = callerEmail === meta.owner
    ? "proprietario"
    : (memberRoles[callerEmail] ? normalizeRole(memberRoles[callerEmail]) : null);
  if (actorRole !== "proprietario" && actorRole !== "collaboratore") {
    return { status: 403, body: { error: "Non hai i permessi per gestire i membri di questo libro." } };
  }

  const targetCurrentRole = memberRoles[targetEmail] ? normalizeRole(memberRoles[targetEmail]) : null;
  const emails = { actorEmail: callerEmail, targetEmail };

  if (action === "invite") {
    if (memberEmails.includes(targetEmail)) {
      return { status: 400, body: { error: "Questa persona è già membro del libro." } };
    }
    if (!canAddMember(memberEmails.length)) {
      return { status: 400, body: { error: "Hai raggiunto il limite di 20 membri per libro." } };
    }
    if (!["redattore", "lettore", "collaboratore"].includes(newRole)) {
      return { status: 400, body: { error: "Ruolo non valido." } };
    }
    if (!canAssignRole(actorRole, null, newRole, emails)) {
      return { status: 403, body: { error: "Non puoi invitare con questo ruolo." } };
    }
    const targetAllowlist = await db.doc(`allowlist/${targetEmail}`).get();
    if (!targetAllowlist.exists) {
      return { status: 400, body: { error: "Questa email non è ancora abilitata (deve essere aggiunta da un admin in \"Gestione utenti\")." } };
    }
    // FieldPath, non una stringa "meta.memberRoles.email": l'email contiene
    // quasi sempre un punto nel dominio (es. "x@test.it"), che Firestore
    // interpreterebbe come separatore di percorso annidato invece che come
    // parte della chiave, scrivendo il valore nel posto sbagliato.
    await bookRef.update(
      "meta.memberEmails", FieldValue.arrayUnion(targetEmail),
      new FieldPath("meta", "memberRoles", targetEmail), newRole
    );
    return { status: 200, body: { ok: true } };
  }

  if (action === "changeRole") {
    if (targetCurrentRole == null) {
      return { status: 404, body: { error: "Questa persona non è membro del libro." } };
    }
    if (!["collaboratore", "redattore", "lettore"].includes(newRole)) {
      return { status: 400, body: { error: "Ruolo non valido." } };
    }
    if (!canAssignRole(actorRole, targetCurrentRole, newRole, emails)) {
      return { status: 403, body: { error: "Non puoi assegnare questo ruolo a questo membro." } };
    }
    await bookRef.update(new FieldPath("meta", "memberRoles", targetEmail), newRole);
    return { status: 200, body: { ok: true } };
  }

  // action === "remove"
  if (targetCurrentRole == null) {
    return { status: 404, body: { error: "Questa persona non è membro del libro." } };
  }
  if (!canRemoveMember(actorRole, targetCurrentRole, emails)) {
    return { status: 403, body: { error: "Non puoi rimuovere questo membro." } };
  }
  await bookRef.update(
    "meta.memberEmails", FieldValue.arrayRemove(targetEmail),
    new FieldPath("meta", "memberRoles", targetEmail), FieldValue.delete()
  );
  return { status: 200, body: { ok: true } };
}
