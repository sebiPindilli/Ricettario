import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { createReport } from "../services/reportsStore.js";
import Toast from "./Toast.jsx";
import AppIcon from "./AppIcon.jsx";

const TYPE_META = {
  bug: { icon: "🐛", svgIcon: "bug", title: "Segnala un bug", placeholder: "Cosa non funziona? Cosa ti aspettavi succedesse invece?" },
  improvement: { icon: "💡", svgIcon: "suggerimento", title: "Proponi un miglioramento", placeholder: "Cosa vorresti che l'app facesse, o facesse meglio?" },
};

export default function ReportFormOverlay({ type, me, onClose, initialScreenshot = null }) {
  const th = useTheme();
  const meta = TYPE_META[type];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState(initialScreenshot);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const [error, setError] = useState(false);

  const canSubmit = title.trim() && description.trim() && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(false);
    try {
      await createReport({ type, title: title.trim(), description: description.trim(), createdBy: me, screenshotDataUrl: screenshot });
      setToast({ msg: "✅ Segnalazione inviata, grazie!", visible: true });
      setTimeout(onClose, 1200);
    } catch {
      setError(true);
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", background: th.appBg, borderRadius: 20, padding: "22px 20px", maxHeight: "90%", overflowY: "auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22, display: "flex" }}><AppIcon emoji={meta.icon} icon={meta.svgIcon} size={22} /></span>
            <span style={{ fontFamily: F.display, fontSize: 18, color: th.appInk }}>{meta.title}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: th.appFaded, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", marginBottom: 5 }}>Titolo</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Riassumi in poche parole"
          style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: th.appCard, fontFamily: F.body, fontSize: 13, color: th.appInk, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
        />

        <div style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", marginBottom: 5 }}>Descrizione</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={meta.placeholder}
          rows={6}
          style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: th.appCard, fontFamily: F.body, fontSize: 13, color: th.appInk, outline: "none", boxSizing: "border-box", resize: "vertical", marginBottom: 18 }}
        />

        {screenshot && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", marginBottom: 5 }}>Schermata allegata</div>
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1.5px solid ${th.appBorder}` }}>
              <img src={screenshot} alt="Anteprima schermata" style={{ width: "100%", display: "block" }} />
              <button onClick={() => setScreenshot(null)} style={{
                position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%",
                border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
              }}>✕</button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "crimson", marginBottom: 12, textAlign: "center" }}>
            Invio non riuscito. Riprova.
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", border: `1.5px solid ${th.appBorder}`, borderRadius: 12, background: "transparent", color: th.appFaded, fontFamily: F.ui, fontSize: 13, cursor: "pointer" }}>Annulla</button>
          <button onClick={submit} disabled={!canSubmit} style={{ flex: 2, padding: "13px", border: "none", borderRadius: 12, background: canSubmit ? th.appAccent : th.appBorder, color: canSubmit ? "#fff" : th.appFaded, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: canSubmit ? "pointer" : "default" }}>
            {submitting ? "Invio…" : "Invia segnalazione"}
          </button>
        </div>
      </div>
      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}
