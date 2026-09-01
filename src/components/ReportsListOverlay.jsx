import { useEffect, useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { loadReports, setReportStatus } from "../services/reportsStore.js";
import Toast from "./Toast.jsx";
import AppIcon from "./AppIcon.jsx";

const TYPE_LABEL = { bug: "[BUG]", improvement: "[MIGLIORAMENTO]" };
const TYPE_ICON = { bug: "🐛", improvement: "💡" };
const TYPE_SVG_ICON = { bug: "bug", improvement: "suggerimento" };

const formatDate = (ts) => {
  if (!ts?.seconds) return "";
  const d = new Date(ts.seconds * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Formato testo leggibile, incollabile in chat — non JSON grezzo.
const buildCopyText = (reports) => reports.map((r) =>
  `${TYPE_LABEL[r.type]} ${r.title}\n${r.description}\n— segnalato da ${r.createdBy} il ${formatDate(r.createdAt)}`
  + (r.screenshotUrl ? `\n— screenshot: ${r.screenshotUrl}` : "")
).join("\n\n");

export default function ReportsListOverlay({ role, me, onClose }) {
  const th = useTheme();
  const isAdmin = role === "admin";
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadReports()
      .then((list) => { setReports(list); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
  }, []);

  const showToast = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg: "", visible: false }), 2000);
  };

  const toggleStatus = async (r) => {
    const resolved = r.status !== "resolved";
    await setReportStatus(r.id, resolved, me);
    setReports((list) => list.map((x) => (x.id === r.id
      ? { ...x, status: resolved ? "resolved" : "open", resolvedBy: resolved ? me : null }
      : x)));
  };

  const toggleSelect = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const copySelected = async () => {
    const chosen = reports.filter((r) => selected.includes(r.id));
    await navigator.clipboard.writeText(buildCopyText(chosen));
    showToast(<><AppIcon emoji="✓" icon="fatto" size={13} /> Copiato negli appunti</>);
  };

  const filtered = reports
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter((r) => typeFilter === "all" || r.type === typeFilter);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 700, background: th.appBg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${th.appBorder}`, flexShrink: 0 }}>
        <span style={{ fontFamily: F.display, fontSize: 18, color: th.appInk }}>📋 Segnalazioni</span>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: th.appFaded, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "10px 20px", flexWrap: "wrap", borderBottom: `1px solid ${th.appBorder}`, flexShrink: 0 }}>
        <FilterPill th={th} active={statusFilter === "open"} onClick={() => setStatusFilter("open")}>Aperte</FilterPill>
        <FilterPill th={th} active={statusFilter === "resolved"} onClick={() => setStatusFilter("resolved")}>Risolte</FilterPill>
        <FilterPill th={th} active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>Tutte</FilterPill>
        <div style={{ width: 1, background: th.appBorder, margin: "2px 4px" }} />
        <FilterPill th={th} active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>Tutti i tipi</FilterPill>
        <FilterPill th={th} active={typeFilter === "bug"} onClick={() => setTypeFilter("bug")}><AppIcon emoji="🐛" icon="bug" size={11} /> Bug</FilterPill>
        <FilterPill th={th} active={typeFilter === "improvement"} onClick={() => setTypeFilter("improvement")}><AppIcon emoji="💡" icon="suggerimento" size={11} /> Miglioramenti</FilterPill>
      </div>

      {isAdmin && (
        <div style={{ padding: "10px 20px 0", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={copySelected} disabled={selected.length === 0} style={{
            padding: "8px 14px", borderRadius: 10, border: "none",
            background: selected.length ? th.appAccent : th.appBorder,
            color: selected.length ? th.appOnAccent : th.appFaded,
            fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: selected.length ? "pointer" : "default",
          }}>Copia selezionate ({selected.length})</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 20px" }}>
        {loading && <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, textAlign: "center", marginTop: 20 }}>Caricamento…</div>}
        {!loading && loadError && (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, textAlign: "center", marginTop: 20 }}>Impossibile caricare le segnalazioni.</div>
        )}
        {!loading && !loadError && filtered.length === 0 && (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, textAlign: "center", marginTop: 20 }}>Nessuna segnalazione.</div>
        )}
        {!loadError && filtered.map((r) => {
          const resolved = r.status === "resolved";
          return (
            <div key={r.id} style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: `1px solid ${th.appBorder}` }}>
              {isAdmin && (
                <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)} style={{ marginTop: 3, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ display: "flex" }}><AppIcon emoji={TYPE_ICON[r.type]} icon={TYPE_SVG_ICON[r.type]} size={13} /></span>
                  <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: th.appInk }}>{r.title}</span>
                  <span style={{
                    marginLeft: "auto", flexShrink: 0, fontFamily: F.ui, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    background: resolved ? `${th.appAccent}22` : th.appBorder,
                    color: resolved ? th.appAccent : th.appFaded,
                  }}>{resolved ? "RISOLTA" : "APERTA"}</span>
                </div>
                <div style={{ fontFamily: F.body, fontSize: 12, color: th.appFaded, marginBottom: 4, whiteSpace: "pre-wrap" }}>{r.description}</div>
                {r.screenshotUrl && (
                  <a href={r.screenshotUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginBottom: 6 }}>
                    <img src={r.screenshotUrl} alt="Schermata allegata" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: `1px solid ${th.appBorder}` }} />
                  </a>
                )}
                <div style={{ fontFamily: F.ui, fontSize: 10, color: th.appFaded, opacity: 0.8 }}>
                  segnalato da {r.createdBy} il {formatDate(r.createdAt)}
                </div>
                {isAdmin && (
                  <button onClick={() => toggleStatus(r)} style={{
                    marginTop: 8, padding: "5px 12px", borderRadius: 8,
                    border: `1.5px solid ${th.appBorder}`, background: "transparent",
                    color: th.appInk, fontFamily: F.ui, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>{resolved ? "Riapri" : "Segna come risolta"}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}

function FilterPill({ th, active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 20, flexShrink: 0,
      border: `1.5px solid ${active ? th.appAccent : th.appBorder}`,
      background: active ? th.appAccent : "transparent",
      color: active ? th.appOnAccent : th.appFaded,
      fontFamily: F.ui, fontSize: 11, fontWeight: 600, cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>{children}</button>
  );
}
