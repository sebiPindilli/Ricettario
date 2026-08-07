// Whitelist: un utente è autorizzato se esiste un documento
// allowlist/{email-minuscolo}; il campo role ("admin"|"tester"|"base")
// determina i permessi lato regole di sicurezza (firestore.rules).
// Il ruolo "admin" non è mai gestibile da qui: solo a mano da Console.
import { db } from "../firebase.js";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

export const checkWhitelist = async (email) => {
  const key = normalizeEmail(email);
  if (!key) return { authorized: false, role: null, defaultBookId: null };
  const snap = await getDoc(doc(db, "allowlist", key));
  if (!snap.exists()) return { authorized: false, role: null, defaultBookId: null };
  return { authorized: true, role: snap.data().role || "base", defaultBookId: snap.data().defaultBookId || null };
};

export const loadAllowlist = async () => {
  const snap = await getDocs(collection(db, "allowlist"));
  return snap.docs
    .map((d) => ({ email: d.id, role: d.data().role || "base" }))
    .sort((a, b) => a.email.localeCompare(b.email));
};

export const addAllowlistEntry = (email, role) =>
  setDoc(doc(db, "allowlist", normalizeEmail(email)), { role });

export const setAllowlistRole = (email, role) =>
  updateDoc(doc(db, "allowlist", email), { role });

export const removeAllowlistEntry = (email) =>
  deleteDoc(doc(db, "allowlist", email));

// Preferenza personale "libro predefinito all'avvio" — ogni utente scrive
// solo il proprio campo, indipendente dalla gestione ruoli (vedi regole).
export const setDefaultBook = (email, bookId) =>
  updateDoc(doc(db, "allowlist", email), { defaultBookId: bookId });

// Interruttore globale del pulsante β di segnalazione bug (non riguarda il
// Ricettario Beta books/b1, sempre accessibile per ruolo). Se il documento
// non esiste ancora (prima installazione, o prima che questo flag esistesse)
// si tratta come "acceso": stesso comportamento di sempre finché nessun
// admin lo spegne esplicitamente.
export const loadBetaConfig = async () => {
  const snap = await getDoc(doc(db, "config", "beta"));
  return { enabled: snap.exists() ? snap.data().enabled !== false : true };
};

export const setBetaEnabled = (enabled) =>
  setDoc(doc(db, "config", "beta"), { enabled });
