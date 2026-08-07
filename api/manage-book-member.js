import { verifyUser } from "../lib/auth.js";
import { getFirestore } from "firebase-admin/firestore";
import { applyMemberAction } from "../src/services/manageBookMemberCore.js";

// Unico punto d'ingresso per invitare, cambiare ruolo o rimuovere un membro
// di un libro — mai dal client direttamente (vedi firestore.rules: nessuno,
// proprietario incluso, può scrivere meta.memberEmails/meta.memberRoles).
// La logica di autorizzazione vive in manageBookMemberCore.js (testabile
// contro l'emulator senza bisogno di un token reale) — qui solo la verifica
// del token e la traduzione della risposta in HTTP.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let user;
  try {
    user = await verifyUser(req.body?.idToken);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  const { status, body } = await applyMemberAction(getFirestore(), {
    callerEmail: user.email,
    bookId: req.body?.bookId,
    action: req.body?.action,
    targetEmail: req.body?.targetEmail,
    newRole: req.body?.newRole,
  });
  return res.status(status).json(body);
}
