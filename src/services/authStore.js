// Whitelist: un utente è autorizzato se esiste un documento
// allowlist/{email-minuscolo}; il campo role ("admin"|"tester"|"base")
// determina i permessi lato regole di sicurezza (firestore.rules).
// Il ruolo "admin" non è mai gestibile da qui: solo a mano da Console.
import { db } from "../firebase.js";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

// Preferenze avviso timer di default: tutti i canali attivi finché
// l'utente non le cambia esplicitamente (stesso principio di betaEnabled
// assente = acceso — mai un valore "spento" implicito per chi non ha mai
// toccato le impostazioni).
export const DEFAULT_TIMER_ALERTS = { sound: true, vibrate: true, visual: true };

export const checkWhitelist = async (email) => {
  const key = normalizeEmail(email);
  if (!key) return { authorized: false, role: null, defaultBookId: null, timerAlerts: DEFAULT_TIMER_ALERTS };
  const snap = await getDoc(doc(db, "allowlist", key));
  if (!snap.exists()) return { authorized: false, role: null, defaultBookId: null, timerAlerts: DEFAULT_TIMER_ALERTS };
  const data = snap.data();
  return {
    authorized: true,
    role: data.role || "base",
    defaultBookId: data.defaultBookId || null,
    timerAlerts: { ...DEFAULT_TIMER_ALERTS, ...(data.timerAlerts || {}) },
  };
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

// Preferenza personale sui canali di avviso dei timer di cucina (suono/
// vibrazione/visivo) — stesso schema di setDefaultBook: ogni utente scrive
// solo il proprio campo.
export const setTimerAlertPrefs = (email, prefs) =>
  updateDoc(doc(db, "allowlist", email), { timerAlerts: prefs });

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
