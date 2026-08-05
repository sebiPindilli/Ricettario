// Fase B — verifica whitelist. Un utente è autorizzato se esiste un
// documento allowlist/{email-minuscolo}; il campo role ("admin"|"base")
// viene esposto all'app ma per ora non differenzia i permessi lato
// regole di sicurezza (vedi Fase D).
import { db } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

export const checkWhitelist = async (email) => {
  const key = (email || "").trim().toLowerCase();
  if (!key) return { authorized: false, role: null };
  const snap = await getDoc(doc(db, "allowlist", key));
  if (!snap.exists()) return { authorized: false, role: null };
  return { authorized: true, role: snap.data().role || "base" };
};
