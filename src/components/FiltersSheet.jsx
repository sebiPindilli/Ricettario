import { useEffect } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import Icon from "./Icon.jsx";

// ══════════════════════════════════════════════════════════════
// FOGLIO FILTRI — guscio del bottom sheet per gli stili "quaderno" e
// "schedario", dove i filtri non stanno più aperti sotto la ricerca.
//
// Qui c'è SOLO il contenitore: i controlli (pillole sezione, accordion tag
// con conteggi, slider tempo con draft/applica, preferiti) sono quelli già
// scritti in RecipesScreen/RecipeFilterBar e vanno SPOSTATI dentro, non
// riscritti — la logica di filtro non cambia.
//
// Chiusura: solo tocco fuori, ✕ o Applica — stesso pattern di ogni altro
// modale del repo (RecipeConflictModal, ServingsDialog, PhotoLightbox…):
// nessuno di loro intercetta il tasto Indietro fisico via popstate. Un
// tentativo in tal senso (voce di history "invisibile", consumata con
// history.back() alla chiusura da UI) è stato scartato: quel back()
// genera comunque un popstate reale che il listener globale di
// useAppNavigation non può distinguere da un Indietro fisico vero, quindi
// avrebbe fatto risalire la pila di navigazione anche chiudendo da ✕ — e a
// un secondo giro avrebbe disallineato la pila dalla history reale del
// browser. Il tasto Indietro fisico, col foglio aperto, naviga quindi come
// sempre (esce dalla schermata, il foglio sparisce con lei): comportamento
// diverso da quanto ipotizzato in IMPLEMENTATION_PLAN "Rischi noti", ma
// coerente con tutti gli altri overlay dell'app.
// ══════════════════════════════════════════════════════════════

export default function FiltersSheet({
  open,
  onClose,
  onApply,
  onReset,
  activeCount = 0,
  title = "Filtri",
  children,
}) {
  const th = useTheme();
  const ui = useUiStyle();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxHeight: "82%",
          display: "flex", flexDirection: "column",
          background: ui.bg,
          borderRadius: "20px 20px 0 0",
          animation: "sheetIn 220ms ease-out",
        }}
      >
        <style dangerouslySetInnerHTML={{ __html:
          "@keyframes sheetIn { from { transform: translateY(100%); } to { transform: none; } }"
        }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: `16px ${ui.padX}px 12px`,
          borderBottom: `1px solid ${ui.hairlineStrong}`,
        }}>
          <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: F.display, fontSize: 20, color: ui.ink }}>{title}</span>
            {activeCount > 0 && (
              <span style={{
                fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: ui.onAccent,
                background: ui.accent, borderRadius: 9, padding: "2px 7px",
              }}>{activeCount}</span>
            )}
          </div>
          {activeCount > 0 && (
            <button onClick={onReset} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: F.ui, fontSize: 11, color: ui.faded, textDecoration: "underline",
            }}>Azzera</button>
          )}
          <button onClick={onClose} title="Chiudi" style={{
            background: "none", border: "none", cursor: "pointer",
            color: ui.faded, padding: 4, display: "flex",
          }}><Icon name="chiudi" size={18} /></button>
        </div>

        {/* Controlli: spostati qui da RecipesScreen / RecipeFilterBar */}
        <div style={{ flex: 1, overflowY: "auto", padding: `12px ${ui.padX}px 8px` }}>
          {children}
        </div>

        <div style={{ padding: `12px ${ui.padX}px 26px`, borderTop: `1px solid ${ui.hairlineStrong}` }}>
          <button onClick={() => { onApply ? onApply() : onClose(); }} style={{
            width: "100%", padding: 15, border: "none",
            borderRadius: ui.radius.control + 1,
            background: th.appInk, color: th.appBg,
            fontFamily: F.ui, fontSize: 12.5, fontWeight: 700,
            letterSpacing: ui.uppercaseButtons ? 1 : 0.4,
            textTransform: ui.uppercaseButtons ? "uppercase" : "none",
            cursor: "pointer",
          }}>Applica</button>
        </div>
      </div>
    </div>
  );
}
