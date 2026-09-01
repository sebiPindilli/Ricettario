import { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";

// ── Picker "Sposta in…" — overlay condiviso da EditSectionedSteps.jsx e
// EditSectionedList.jsx (la forma {section,items} è identica per step e
// ingredienti). Stesso pattern di SectionPicker.jsx per "Nuova sezione"
// (overlay centrato, card, nessun <select> nativo), semplificato: qui è
// una sottosezione di contenuto dentro UNA ricetta, non una macro-sezione
// del libro — solo un nome, niente emoji.
//
// Non contiene alcuna logica di spostamento: restituisce solo la
// destinazione scelta a onPick({type:"existing",sectionIndex} oppure
// {type:"new",name}), il chiamante applica moveItemsBetweenSections.
export default function SectionMovePicker({ sections, excludeSectionIndex = null, onPick, onClose }) {
  const th = useTheme();
  const ui = useUiStyle();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const itemPreview = (sec) => {
    const first = sec.items?.[0];
    if (!first) return "";
    const text = typeof first === "string" ? first : (first.text ?? first.name ?? "");
    return text.length > 28 ? text.slice(0, 28) + "…" : text;
  };

  // Tile sintetica "Sciolti (nuovo gruppo)" solo se, tra le sezioni
  // mostrate (esclusa quella corrente), non esiste già un gruppo senza
  // nome — evita di offrire un secondo gruppo sciolto quando ce n'è già
  // uno visibile in lista.
  const hasVisibleLoose = sections.some((sec, si) => si !== excludeSectionIndex && sec.section === "");

  const confirmNew = () => {
    if (!newName.trim()) return;
    onPick({ type: "new", name: newName });
  };

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "80%", overflowY: "auto", background: th.appBg, borderRadius: 18, padding: "18px 16px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ fontFamily: F.display, fontSize: 16, color: th.appInk, textAlign: "center", marginBottom: 12 }}>Sposta in…</div>

        {!creating ? (
          <>
            {sections.map((sec, si) => si === excludeSectionIndex ? null : (
              <button key={si} onClick={() => onPick({ type: "existing", sectionIndex: si })} style={{
                width: "100%", textAlign: "left", padding: "11px 14px", marginBottom: 8,
                border: `1.5px solid ${ui.border}`, borderRadius: 12, background: ui.card,
                color: th.appInk, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                {sec.section || "Sciolti"}
                {!sec.section && itemPreview(sec) && (
                  <span style={{ fontWeight: 400, color: th.appFaded }}> — "{itemPreview(sec)}"</span>
                )}
              </button>
            ))}

            {!hasVisibleLoose && (
              <button onClick={() => onPick({ type: "new", name: "" })} style={{
                width: "100%", textAlign: "left", padding: "11px 14px", marginBottom: 8,
                border: `1.5px solid ${ui.border}`, borderRadius: 12, background: ui.card,
                color: th.appInk, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Sciolti (nuovo gruppo)</button>
            )}

            <button onClick={() => setCreating(true)} style={{
              width: "100%", padding: "11px 14px", marginBottom: 12,
              border: `1.5px dashed ${ui.border}`, borderRadius: 12, background: "transparent",
              color: th.appFaded, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>＋ Nuova sezione</button>

            <button onClick={onClose} style={{ width: "100%", padding: "11px", border: `1.5px solid ${ui.border}`, borderRadius: 12, background: "transparent", color: th.appFaded, fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>Annulla</button>
          </>
        ) : (
          <>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && confirmNew()}
              placeholder="Nome sottosezione…"
              autoFocus
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", marginBottom: 12, border: `1.5px solid ${ui.border}`, borderRadius: 10, background: ui.card, fontFamily: F.body, fontSize: 14, color: th.appInk, outline: "none" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCreating(false)} style={{ flex: 1, padding: "11px", border: `1.5px solid ${ui.border}`, borderRadius: 12, background: "transparent", color: th.appFaded, fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>‹ Indietro</button>
              <button onClick={confirmNew} disabled={!newName.trim()} style={{ flex: 2, padding: "11px", border: "none", borderRadius: 12, background: newName.trim() ? th.appAccent : ui.border, color: newName.trim() ? th.appOnAccent : th.appFaded, fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: newName.trim() ? "pointer" : "default" }}>Sposta</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
