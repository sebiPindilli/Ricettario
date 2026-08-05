// Fase C — gate di autenticazione: nessun dato dell'app viene caricato
// finché l'utente non è loggato con Google E presente in allowlist.
// children è una render-prop: children(user, role) viene chiamata solo
// quando lo stato è "authorized".
import { useState, useEffect } from "react";
import { auth } from "../firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { checkWhitelist } from "../services/authStore.js";

const provider = new GoogleAuthProvider();

const pageStyle = {
  minHeight: "100vh", display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", gap: 16,
  fontFamily: "sans-serif", padding: 20, textAlign: "center",
};

export default function AuthGate({ children }) {
  // loading | loggedOut | unauthorized | authorized
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null); setRole(null); setStatus("loggedOut");
        return;
      }
      const { authorized, role: r } = await checkWhitelist(u.email);
      setUser(u);
      if (authorized) { setRole(r); setStatus("authorized"); }
      else { setRole(null); setStatus("unauthorized"); }
    });
  }, []);

  const doSignIn = async () => {
    setError("");
    try {
      await signInWithPopup(auth, provider);
    } catch {
      setError("Accesso non riuscito. Riprova.");
    }
  };

  const doSignOut = () => signOut(auth);

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

  return children(user, role);
}
