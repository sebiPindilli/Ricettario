// Verifica lato server: token Firebase Auth valido + email in whitelist.
// Usa l'Admin SDK (bypassa le regole di sicurezza, accesso diretto a
// Firestore) — pensato per essere riusato da qualunque endpoint /api/*
// futuro, non solo dal proxy Gemini.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // La chiave arriva dall'env var con "\n" letterali (due caratteri);
      // qui li convertiamo in veri a capo. Se fossero già veri a capo
      // (env var gestita diversamente), il replace è un no-op innocuo.
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

export async function verifyUser(idToken) {
  if (!idToken) throw new Error("Token mancante");
  const decoded = await getAuth().verifyIdToken(idToken);
  const email = (decoded.email || "").trim().toLowerCase();
  const snap = await getFirestore().doc(`allowlist/${email}`).get();
  if (!snap.exists) throw new Error("Utente non autorizzato");
  return { email, role: snap.data().role || "base" };
}
