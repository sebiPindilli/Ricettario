// Fase C — gate di autenticazione: nessun dato dell'app viene caricato
// finché l'utente non è loggato con Google E presente in allowlist.
// children è una render-prop: children(user, role, defaultBookId,
// betaEnabled, timerAlerts, pdfTemplates, defaultPdfTemplateId, iconStyle)
// viene chiamata solo quando lo stato è "authorized".
import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { checkWhitelist, loadBetaConfig, loadIconStyleConfig, DEFAULT_TIMER_ALERTS } from "../services/authStore.js";
import { OfflineNoCacheError } from "../services/offlineFirst.js";
import { withTimeout } from "../utils/helpers.js";
import { F } from "../data/constants.js";
import { resolveUiStyle, isUiStyleId, DEFAULT_UI_STYLE_ID, buildTheme } from "../data/uiStyles.js";
import { isPaletteId, DEFAULT_PALETTE_ID } from "../data/palettes.js";

const provider = new GoogleAuthProvider();
// AuthGate è montato PRIMA di ogni provider (Theme/UiStyle vivono dentro
// AppInner, raggiunto solo dopo l'autenticazione): nessun useTheme()/
// useUiStyle() qui. Palette, tema chiaro/scuro e stile sono tutte preferenze
// PERSONALI in localStorage (Fase 6, PALETTE.md) — sopravvivono al login,
// quindi si leggono direttamente qui invece di aspettare AppInner.
const readUiStyleId = () => {
  try {
    const saved = localStorage.getItem("ricettario.uiStyle");
    return isUiStyleId(saved) ? saved : DEFAULT_UI_STYLE_ID;
  } catch { return DEFAULT_UI_STYLE_ID; }
};
const readPaletteId = () => {
  try {
    const saved = localStorage.getItem("ricettario.palette");
    return isPaletteId(saved) ? saved : DEFAULT_PALETTE_ID;
  } catch { return DEFAULT_PALETTE_ID; }
};
const readTemaScuro = () => {
  try { return localStorage.getItem("ricettario.temaScuro") === "1"; } catch { return false; }
};
const BOOT_TIMEOUT_MS = 10000;
// Offline, il margine serve solo a coprire la lettura dalla cache locale
// (istantanea) — non c'è alcuna rete da aspettare, quindi un timeout più
// corto evita di far percepire un'attesa che non porterà comunque a nulla.
const BOOT_TIMEOUT_MS_OFFLINE = 4000;

const pageStyle = {
  minHeight: "100vh", display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", gap: 16,
  fontFamily: "sans-serif", padding: 20, textAlign: "center",
};

// Copertina a tutto schermo, azione in fondo su fascia scura — stessa
// impaginazione per ogni stato (DECISIONI.md §Accesso), cambia solo il
// testo. Solo negli stili nuovi: in classico resta pageStyle (sotto).
const CoverShell = ({ title, sub, children: body, theme }) => (
  <div style={{
    minHeight: "100vh", display: "flex", flexDirection: "column",
    background: theme.coverBg, color: theme.coverText,
  }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", textAlign: "center" }}>
      <div style={{ fontFamily: F.ui, fontSize: 11, letterSpacing: 4, opacity: 0.6, textTransform: "uppercase", marginBottom: 10 }}>Il mio</div>
      <div style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", marginBottom: 22 }}>Ricettario</div>
      <div style={{ fontFamily: F.display, fontSize: 18, marginBottom: 10 }}>{title}</div>
      {sub && <div style={{ fontFamily: F.ui, fontSize: 12.5, opacity: 0.8, lineHeight: 1.6, maxWidth: 320 }}>{sub}</div>}
    </div>
    <div style={{ background: "rgba(0,0,0,0.35)", padding: "18px 24px calc(18px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", gap: 10 }}>
      {body}
    </div>
  </div>
);
const coverGhostBtn = { width: "100%", padding: "12px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.3)", background: "transparent", color: "rgba(255,255,255,0.85)", fontFamily: F.ui, fontSize: 13, cursor: "pointer" };

export default function AuthGate({ children }) {
  // Calcolato una sola volta per montaggio (lazy init), non ad ogni
  // import del modulo: lo stile si cambia comunque solo da autenticati.
  const [uiStyleId] = useState(readUiStyleId);
  const [paletteId] = useState(readPaletteId);
  const [temaScuro] = useState(readTemaScuro);
  const isNewStyle = uiStyleId !== "classico";
  const theme = buildTheme(paletteId, temaScuro);
  const uiCover = resolveUiStyle(theme, uiStyleId);
  const coverPrimaryBtn = { width: "100%", padding: "14px", borderRadius: 12, border: "none", background: uiCover.accent, color: "#fff", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" };
  // loading | loggedOut | unauthorized | authorized | offlineNoCache | error
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [defaultBookId, setDefaultBookId] = useState(null);
  const [betaEnabled, setBetaEnabled] = useState(true);
  const [timerAlerts, setTimerAlerts] = useState(DEFAULT_TIMER_ALERTS);
  const [pdfTemplates, setPdfTemplates] = useState({});
  const [defaultPdfTemplateId, setDefaultPdfTemplateId] = useState(null);
  const [iconStyle, setIconStyle] = useState("emoji");
  const [error, setError] = useState("");

  // Percorso post-autenticazione (whitelist + config beta): isolato in una
  // funzione a sé così può essere ripetuto dal pulsante "Riprova" senza
  // passare di nuovo dal popup Google. Qualsiasi eccezione qui dentro
  // (rete, timeout) finisce in uno stato "error" esplicito — mai un
  // caricamento senza uscita.
  const runBootstrap = useCallback(async (u) => {
    setUser(u);
    const offline = !navigator.onLine;
    const timeoutMs = offline ? BOOT_TIMEOUT_MS_OFFLINE : BOOT_TIMEOUT_MS;
    try {
      const { authorized, role: r, defaultBookId: d, timerAlerts: ta, pdfTemplates: pt, defaultPdfTemplateId: dpt } =
        await withTimeout(checkWhitelist(u.email), timeoutMs);
      if (!authorized) {
        setRole(null); setDefaultBookId(null); setStatus("unauthorized");
        return;
      }
      setRole(r); setDefaultBookId(d); setTimerAlerts(ta); setPdfTemplates(pt); setDefaultPdfTemplateId(dpt);
      // Serve solo ad admin/tester (vedi BetaButton.jsx) — non blocca
      // l'accesso di chi ha ruolo base. Non fatale: se non disponibile
      // offline non deve impedire l'ingresso nell'app.
      try {
        const { enabled } = await withTimeout(loadBetaConfig(), timeoutMs);
        setBetaEnabled(enabled);
      } catch (e) {
        console.warn("Config beta non disponibile", e);
      }
      // Interruttore globale emoji/SVG (vedi context.js IconStyleCtx) — non
      // fatale: se non disponibile offline, l'app entra comunque con
      // "emoji" (default sicuro, comportamento identico a prima).
      try {
        const { style } = await withTimeout(loadIconStyleConfig(), timeoutMs);
        setIconStyle(style);
      } catch (e) {
        console.warn("Config stile icone non disponibile", e);
      }
      setStatus("authorized");
    } catch (e) {
      console.warn("Bootstrap non riuscito", e);
      setStatus(e instanceof OfflineNoCacheError ? "offlineNoCache" : "error");
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
    if (isNewStyle) return <CoverShell theme={theme} title="Caricamento…" />;
    return <div style={pageStyle}>Caricamento…</div>;
  }

  if (status === "loggedOut") {
    if (isNewStyle) {
      return (
        <CoverShell theme={theme} title="Tocca per entrare" sub="Prototipo — funziona solo per chi è stato autorizzato.">
          <button onClick={doSignIn} style={coverPrimaryBtn}>Accedi con Google</button>
          {error && <div style={{ fontFamily: F.ui, fontSize: 12, color: "#FFD0C8", textAlign: "center" }}>{error}</div>}
        </CoverShell>
      );
    }
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
    // Copy per chi non è in whitelist (DECISIONI.md §Accesso)
    if (isNewStyle) {
      return (
        <CoverShell theme={theme} title="Accesso non autorizzato" sub={`L'app è ancora un prototipo e funziona solo per chi è stato autorizzato. Scrivi all'admin per farti aggiungere. (${user?.email})`}>
          <button onClick={doSignOut} style={coverGhostBtn}>Prova un altro account</button>
        </CoverShell>
      );
    }
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

  if (status === "offlineNoCache") {
    if (isNewStyle) {
      return (
        <CoverShell theme={theme} title="Nessuna connessione" sub="Non ci sono ancora dati salvati su questo dispositivo: la prima apertura richiede una connessione internet.">
          <button onClick={retry} style={coverPrimaryBtn}>Riprova</button>
          <button onClick={doSignOut} style={coverGhostBtn}>Esci e riprova</button>
        </CoverShell>
      );
    }
    return (
      <div style={pageStyle}>
        <h1>Nessuna connessione</h1>
        <p>Non ci sono ancora dati salvati su questo dispositivo: la prima apertura richiede una connessione internet.</p>
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

  if (status === "error") {
    if (isNewStyle) {
      return (
        <CoverShell theme={theme} title="Accesso non riuscito" sub="Controlla la connessione e riprova.">
          <button onClick={retry} style={coverPrimaryBtn}>Riprova</button>
          <button onClick={doSignOut} style={coverGhostBtn}>Esci e riprova</button>
        </CoverShell>
      );
    }
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

  return children(user, role, defaultBookId, betaEnabled, timerAlerts, pdfTemplates, defaultPdfTemplateId, iconStyle);
}
