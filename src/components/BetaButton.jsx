import { useState } from "react";
import html2canvas from "html2canvas";
import { useTheme, useRole } from "../context.js";
import { F } from "../data/constants.js";
import { auth } from "../firebase.js";
import ReportFormOverlay from "./ReportFormOverlay.jsx";
import ReportsListOverlay from "./ReportsListOverlay.jsx";

// Cattura cosa c'è sullo schermo un attimo prima di aprire il form (non è
// uno screenshot reale — il browser non può farne uno senza il dialogo di
// sistema "condividi schermo", indisponibile su mobile — ma un ridisegno
// del DOM in immagine). useCORS tenta di includere anche le foto caricate
// da Storage; se fallisce (es. bucket senza CORS configurato, o qualunque
// altro errore) si rinuncia allo screenshot senza bloccare la segnalazione.
const captureScreenshot = async () => {
  const target = document.querySelector(".iphone-shell");
  if (!target) return null;
  try {
    const canvas = await html2canvas(target, { useCORS: true, backgroundColor: null, scale: 1 });
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return null;
  }
};

// ── Punto d'accesso alla modalità beta — visibile solo ad admin/tester ──
// Montato dentro IPhone come sibling del contenuto scrollabile: su desktop
// resta ancorato all'angolo del mockup (position:absolute), perché lì
// position:fixed uscirebbe dalla sagoma del telefono disegnato. Su mobile
// reale (stesso breakpoint di IPHONE_RESPONSIVE_CSS in ricettario-v23.jsx)
// il telefono ORA riempie il vero schermo, quindi passa a position:fixed:
// resta ancorato al viewport vero, immune a qualunque scroll (interno alla
// pagina o, più raro, esterno dell'intero shell).
const BETA_FAB_RESPONSIVE_CSS = `
  @media (max-width: 480px) {
    .beta-fab-button, .beta-fab-menu { position:fixed !important; }
  }
`;

export default function BetaButton() {
  const role = useRole();
  const th = useTheme();
  const [view, setView] = useState(null); // null | "menu" | "form-bug" | "form-improvement" | "list"
  const [screenshot, setScreenshot] = useState(null);
  const [capturing, setCapturing] = useState(false);

  if (role !== "admin" && role !== "tester") return null;

  const me = auth.currentUser?.email || "";
  const close = () => { setView(null); setScreenshot(null); };

  const openBugReport = async () => {
    setCapturing(true);
    setScreenshot(await captureScreenshot());
    setCapturing(false);
    setView("form-bug");
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BETA_FAB_RESPONSIVE_CSS }} />
      <button
        className="beta-fab-button"
        onClick={() => setView((v) => (v === "menu" ? null : "menu"))}
        aria-label="Modalità beta"
        style={{
          position: "absolute", bottom: 20, right: 20, zIndex: 150,
          width: 52, height: 52, borderRadius: "50%",
          border: "none", background: th.appAccent, color: "#fff",
          fontFamily: F.display, fontSize: 22, fontWeight: 700,
          boxShadow: "0 6px 16px rgba(0,0,0,0.3)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >β</button>

      {view === "menu" && (
        <div onClick={close} style={{ position: "absolute", inset: 0, zIndex: 160 }}>
          <div className="beta-fab-menu" onClick={(e) => e.stopPropagation()} style={{
            position: "absolute", bottom: 80, right: 20,
            background: th.appBg, borderRadius: 14, minWidth: 230,
            border: `1px solid ${th.appBorder}`, overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}>
            <MenuItem th={th} icon="🐛" label={capturing ? "Cattura schermata…" : "Segnala un bug"} onClick={openBugReport} disabled={capturing} />
            <MenuItem th={th} icon="💡" label="Proponi un miglioramento" onClick={() => setView("form-improvement")} disabled={capturing} />
            <MenuItem th={th} icon="📋" label="Visualizza segnalazioni" onClick={() => setView("list")} disabled={capturing} last />
          </div>
        </div>
      )}

      {(view === "form-bug" || view === "form-improvement") && (
        <ReportFormOverlay
          type={view === "form-bug" ? "bug" : "improvement"}
          me={me}
          onClose={close}
          initialScreenshot={view === "form-bug" ? screenshot : null}
        />
      )}

      {view === "list" && (
        <ReportsListOverlay role={role} me={me} onClose={close} />
      )}
    </>
  );
}

function MenuItem({ th, icon, label, onClick, last = false, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%", boxSizing: "border-box",
      padding: "14px 16px", border: "none", background: "none",
      borderBottom: last ? "none" : `1px solid ${th.appBorder}`,
      fontFamily: F.ui, fontSize: 13, color: disabled ? th.appFaded : th.appInk, textAlign: "left",
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.7 : 1,
    }}>
      <span style={{ fontSize: 17 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
