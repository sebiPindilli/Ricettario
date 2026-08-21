import { verifyUser } from "../lib/auth.js";
import { getFirestore } from "firebase-admin/firestore";

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

  const name = (req.body?.name || "").trim() || "Nuovo ricettario";
  const bookTheme = req.body?.bookTheme || "classic";
  const type = req.body?.type === "personale" ? "personale" : "condiviso";
  // isBackup/backupForBookId: impostati qui in creazione (Admin SDK, bypassa
  // le regole) invece che con un update client successivo — le firestore.rules
  // permettono di aggiornare solo name/bookTheme su un libro esistente (vedi
  // restoreBackup in ricettario-v23.jsx, che altrimenti riceverebbe permission-denied).
  const isBackup = req.body?.isBackup === true;
  const backupForBookId = isBackup && typeof req.body?.backupForBookId === "string" ? req.body.backupForBookId : null;

  const db = getFirestore();
  const allowlistRef = db.doc(`allowlist/${user.email}`);
  const newBookRef = db.collection("books").doc();
  const meta = { name, type, bookTheme, owner: user.email, memberEmails: [], memberRoles: {} };
  if (isBackup) { meta.isBackup = true; meta.backupForBookId = backupForBookId; }

  try {
    // Il conteggio va fatto qui, lato server con Admin SDK: un contatore
    // aggiornato solo dal client sarebbe aggirabile da chi salta l'app e
    // chiama Firestore direttamente, senza mai incrementarlo.
    await db.runTransaction(async (tx) => {
      const allowSnap = await tx.get(allowlistRef);
      const count = allowSnap.data()?.ownedBooksCount || 0;
      if (count >= 10) throw new Error("Hai raggiunto il limite di 10 ricettari di proprietà.");
      tx.set(newBookRef, { meta });
      tx.update(allowlistRef, { ownedBooksCount: count + 1 });
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(200).json({ id: newBookRef.id, meta });
}
