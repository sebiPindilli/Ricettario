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

  const bookId = req.body?.bookId;
  if (!bookId || bookId === "b1") {
    return res.status(400).json({ error: "Questo libro non può essere eliminato." });
  }

  const db = getFirestore();
  const bookRef = db.collection("books").doc(bookId);
  const bookSnap = await bookRef.get();
  if (!bookSnap.exists) {
    return res.status(404).json({ error: "Libro non trovato." });
  }
  const meta = bookSnap.data().meta;
  if (meta.owner !== user.email) {
    return res.status(403).json({ error: "Solo il proprietario può eliminare questo libro." });
  }
  if (meta.type === "personale") {
    return res.status(400).json({ error: "Il libro personale non può essere eliminato." });
  }

  await db.recursiveDelete(bookRef);

  const allowlistRef = db.doc(`allowlist/${user.email}`);
  await db.runTransaction(async (tx) => {
    const allowSnap = await tx.get(allowlistRef);
    const count = allowSnap.data()?.ownedBooksCount || 0;
    tx.update(allowlistRef, { ownedBooksCount: Math.max(0, count - 1) });
  });

  return res.status(200).json({ ok: true });
}
