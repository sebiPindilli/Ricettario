import { useState } from "react";
import { useTheme, useRole } from "../context.js";
import { F } from "../data/constants.js";
import { auth } from "../firebase.js";
import ReportFormOverlay from "./ReportFormOverlay.jsx";
import ReportsListOverlay from "./ReportsListOverlay.jsx";

// ── Punto d'accesso alla modalità beta — visibile solo ad admin/tester ──
// Montato dentro IPhone come sibling del contenuto scrollabile: resta
// ancorato all'angolo del mockup indipendentemente dallo scroll, senza
// bisogno di position:fixed (vedi nota in ricettario-v23.jsx sull'IPhone shell).
export default function BetaButton() {
  const role = useRole();
  const th = useTheme();
  const [view, setView] = useState(null); // null | "menu" | "form-bug" | "form-improvement" | "list"

  if (role !== "admin" && role !== "tester") return null;

  const me = auth.currentUser?.email || "";
  const close = () => setView(null);

  return (
    <>
      <button
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
          <div onClick={(e) => e.stopPropagation()} style={{
            position: "absolute", bottom: 80, right: 20,
            background: th.appBg, borderRadius: 14, minWidth: 230,
            border: `1px solid ${th.appBorder}`, overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}>
            <MenuItem th={th} icon="🐛" label="Segnala un bug" onClick={() => setView("form-bug")} />
            <MenuItem th={th} icon="💡" label="Proponi un miglioramento" onClick={() => setView("form-improvement")} />
            <MenuItem th={th} icon="📋" label="Visualizza segnalazioni" onClick={() => setView("list")} last />
          </div>
        </div>
      )}

      {(view === "form-bug" || view === "form-improvement") && (
        <ReportFormOverlay type={view === "form-bug" ? "bug" : "improvement"} me={me} onClose={close} />
      )}

      {view === "list" && (
        <ReportsListOverlay role={role} me={me} onClose={close} />
      )}
    </>
  );
}

function MenuItem({ th, icon, label, onClick, last = false }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%", boxSizing: "border-box",
      padding: "14px 16px", border: "none", background: "none",
      borderBottom: last ? "none" : `1px solid ${th.appBorder}`,
      fontFamily: F.ui, fontSize: 13, color: th.appInk, textAlign: "left", cursor: "pointer",
    }}>
      <span style={{ fontSize: 17 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
