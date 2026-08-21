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
  // Un libro personale è eliminabile come qualunque altro (owner-only, mai
  // b1) — l'unico vincolo è non lasciare l'utente a zero ricettari: senza
  // questo, l'app romperebbe a metà sessione (activeBookId punterebbe a un
  // libro appena cancellato). Se l'utente arriva comunque a zero libri tra
  // un avvio e l'altro, il bootstrap se ne accorge e ne ricrea uno vuoto
  // (vedi bootstrapBooks in ricettario-v23.jsx) — qui si evita solo la
  // rottura immediata nella sessione corrente.
  const [ownedSnap, memberSnap] = await Promise.all([
    db.collection("books").where("meta.owner", "==", user.email).limit(2).get(),
    db.collection("books").where("meta.memberEmails", "array-contains", user.email).limit(2).get(),
  ]);
  const hasAnotherBook = [...ownedSnap.docs, ...memberSnap.docs].some((d) => d.id !== bookId);
  if (!hasAnotherBook) {
    return res.status(400).json({ error: "Non puoi eliminare l'unico ricettario rimasto." });
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
