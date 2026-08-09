// Fase C — gate di autenticazione: nessun dato dell'app viene caricato
// finché l'utente non è loggato con Google E presente in allowlist.
// children è una render-prop: children(user, role, defaultBookId) viene
// chiamata solo quando lo stato è "authorized".
import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { checkWhitelist, loadBetaConfig } from "../services/authStore.js";
import { withTimeout } from "../utils/helpers.js";

const provider = new GoogleAuthProvider();
const BOOT_TIMEOUT_MS = 10000;

const pageStyle = {
  minHeight: "100vh", display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", gap: 16,
  fontFamily: "sans-serif", padding: 20, textAlign: "center",
};

export default function AuthGate({ children }) {
  // loading | loggedOut | unauthorized | authorized | error
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [defaultBookId, setDefaultBookId] = useState(null);
  const [betaEnabled, setBetaEnabled] = useState(true);
  const [error, setError] = useState("");

  // Percorso post-autenticazione (whitelist + config beta): isolato in una
  // funzione a sé così può essere ripetuto dal pulsante "Riprova" senza
  // passare di nuovo dal popup Google. Qualsiasi eccezione qui dentro
  // (rete, timeout) finisce in uno stato "error" esplicito — mai un
  // caricamento senza uscita.
  const runBootstrap = useCallback(async (u) => {
    setUser(u);
    try {
      const { authorized, role: r, defaultBookId: d } =
        await withTimeout(checkWhitelist(u.email), BOOT_TIMEOUT_MS);
      if (!authorized) {
        setRole(null); setDefaultBookId(null); setStatus("unauthorized");
        return;
      }
      setRole(r); setDefaultBookId(d);
      // Serve solo ad admin/tester (vedi BetaButton.jsx) — non blocca
      // l'accesso di chi ha ruolo base, letto comunque per semplicità.
      const { enabled } = await withTimeout(loadBetaConfig(), BOOT_TIMEOUT_MS);
      setBetaEnabled(enabled);
      setStatus("authorized");
    } catch (e) {
      console.warn("Bootstrap non riuscito", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser(null); setRole(null); setDefaultBookId(null); setStatus("loggedOut");
        return;
      }
      setStatus("loading");
      runBootstrap(u);
    });
  }, [runBootstrap]);

  const doSignIn = async () => {
    setError("");
    try {
      await signInWithPopup(auth, provider);
    } catch {
      setError("Accesso non riuscito. Riprova.");
    }
  };

  const doSignOut = () => signOut(auth);

  const retry = () => {
    if (auth.currentUser) { setStatus("loading"); runBootstrap(auth.currentUser); }
  };

  if (status === "loading") {
    return <div style={pageStyle}>Caricamento…</div>;
  }

  if (status === "loggedOut") {
    return (
      <div style={pageStyle}>
        <h1>Ricettario</h1>
        <button onClick={doSignIn} style={{ padding: "12px 24px", fontSize: 16, cursor: "pointer" }}>
          Accedi con Google
        </button>
        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div style={pageStyle}>
        <h1>Accesso non autorizzato</h1>
        <p>L'account <strong>{user?.email}</strong> non è abilitato per questa app.</p>
        <button onClick={doSignOut} style={{ padding: "10px 20px", cursor: "pointer" }}>
          Prova un altro account
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={pageStyle}>
        <h1>Accesso non riuscito</h1>
        <p>Controlla la connessione e riprova.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={retry} style={{ padding: "10px 20px", cursor: "pointer" }}>
            Riprova
          </button>
          <button onClick={doSignOut} style={{ padding: "10px 20px", cursor: "pointer" }}>
            Esci e riprova
          </button>
        </div>
      </div>
    );
  }

  return children(user, role, defaultBookId, betaEnabled);
}
