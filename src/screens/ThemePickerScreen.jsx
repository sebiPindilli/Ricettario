import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { PALETTES, colori } from "../data/palettes.js";
import { UI_STYLES } from "../data/uiStyles.js";
import BackBtn from "../components/BackBtn.jsx";
import Icon from "../components/Icon.jsx";
import Toast from "../components/Toast.jsx";

// ══════════════════════════════════════════════════════════════
// SCHERMATA: ASPETTO DELL'APP — Fase 6 (PALETTE.md).
//
// Sostituisce ThemePickerScreen ("Stile del libro", BOOK_THEMES) e
// UiStylePickerScreen ("Stile dell'interfaccia"): erano due schermate per
// una decisione sola. Tre assi indipendenti, sempre in quest'ordine:
//   1. Colore  — una delle 10 palette (data/palettes.js)
//   2. Tema    — chiaro / scuro
//   3. Stile   — Classico / Quaderno / Schedario (struttura, non colore)
// Ogni scelta si applica subito (nessun draft/applica) e si persiste in
// localStorage — preferenza personale per dispositivo, non condivisa via
// Firestore (a differenza del vecchio "Stile del libro").
// ══════════════════════════════════════════════════════════════

// Mini-mockup dell'elenco ricette a 3 righe — stesso disegno già usato in
// UiStylePickerScreen, così la differenza fra i tre stili si vede senza
// aprire l'app. `th` è il tema LIVE (già riflette la palette/tema scelti,
// perché il cambio è immediato): cambiare stile aggiorna anche i colori.
const StylePreview = ({ styleId, th }) => {
  const rows = [
    { color: th.appAccent,  icon: "pasta" },
    { color: th.appAccent2, icon: "torta" },
    { color: "#6B8C6E",     icon: "patata" },
  ];
  const navTop = styleId === "classico";
  const navDark = styleId === "schedario";

  return (
    <div style={{
      height: 168, borderRadius: 12, overflow: "hidden",
      background: styleId === "quaderno" ? th.appBg : th.appBg,
      border: `1px solid ${th.appBorder}`,
      display: "flex", flexDirection: "column",
    }}>
      {navTop && (
        <div style={{ display: "flex", gap: 4, background: th.appInk, padding: "6px 5px" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ flex: 1, height: 12, borderRadius: 3, background: i === 0 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)" }}/>
          ))}
        </div>
      )}
      <div style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: styleId === "quaderno" ? 0 : 6 }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: styleId === "quaderno" ? 7 : 4 }}>
          <div style={{
            flex: 1, height: 14, borderRadius: styleId === "classico" ? 7 : 4,
            background: styleId === "quaderno" ? "transparent" : th.appCard,
            borderBottom: styleId === "quaderno" ? `1px solid ${th.appBorder}` : "none",
            border: styleId === "schedario" ? `1px solid ${th.appBorder}` : undefined,
          }}/>
          {styleId !== "classico" && <div style={{ width: 26, height: 14, borderRadius: 4, background: th.appInk }}/>}
        </div>
        {styleId === "classico" && (
          <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
            {[14, 20, 16, 18].map((w, i) => (
              <div key={i} style={{ width: w, height: 9, borderRadius: 5, background: i === 0 ? th.appInk : th.appBorder }}/>
            ))}
          </div>
        )}
        {rows.map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: styleId === "quaderno" ? "7px 0" : "6px 7px",
            background: styleId === "classico" ? th.appCard : styleId === "schedario" ? th.appCard : "transparent",
            border: styleId === "quaderno" ? "none" : `1px solid ${th.appBorder}`,
            borderBottom: styleId === "quaderno" ? `1px solid ${th.appBorder}` : undefined,
            borderRadius: styleId === "classico" ? 8 : styleId === "schedario" ? 7 : 0,
            boxShadow: styleId === "classico" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
          }}>
            <div style={{
              width: styleId === "schedario" ? 20 : 18, height: styleId === "schedario" ? 20 : 18,
              borderRadius: 5, flexShrink: 0,
              background: styleId === "classico" ? r.color : `${r.color}22`,
              color: styleId === "classico" ? "#fff" : r.color,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {styleId === "classico" ? null : <Icon name={r.icon} size={11} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 6, width: `${64 - i * 8}%`, borderRadius: 3, background: th.appInk, opacity: 0.75 }}/>
              <div style={{ height: 4, width: "38%", borderRadius: 2, background: th.appFaded, opacity: 0.4, marginTop: 4 }}/>
            </div>
            {styleId !== "classico" && <div style={{ height: 5, width: 16, borderRadius: 2, background: th.appAccent, opacity: 0.8 }}/>}
          </div>
        ))}
      </div>
      {!navTop && (
        <div style={{
          display: "flex", gap: 4,
          background: navDark ? th.navBg : th.appBg,
          borderTop: navDark ? "none" : `1px solid ${th.appBorder}`,
          padding: "6px 5px 7px",
        }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1, height: 10, borderRadius: 3,
              background: navDark
                ? (i === 0 ? th.navActive : "rgba(255,255,255,0.14)")
                : (i === 0 ? th.appAccent : th.appBorder),
            }}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ThemePickerScreen({ paletteId, temaScuro, uiStyleId, onSelectPalette, onSelectTemaScuro, onSelectUiStyle, onBack }) {
  const th = useTheme();
  const [toast, setToast] = useState({ msg: "", visible: false });
  const showToast = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg: "", visible: false }), 2000);
  };

  const activePalette = PALETTES.find(p => p.id === paletteId) || PALETTES[0];
  const summary = `${activePalette.nome} · ${temaScuro ? "scuro" : "chiaro"} · ${(UI_STYLES.find(s => s.id === uiStyleId) || UI_STYLES[0]).name}`;

  return (
    <div style={{ background: th.appBg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 20px 0" }}><BackBtn onBack={onBack} label="Indietro"/></div>
      <div style={{ padding: "12px 20px 4px" }}>
        <div style={{ fontFamily: F.display, fontSize: 24, color: th.appInk }}>Aspetto dell'app</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, marginTop: 4, lineHeight: 1.5 }}>
          Colore, tema e struttura: tre scelte indipendenti, ognuna cambia subito.
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 40px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── 1. Colore ─────────────────────────────────────────── */}
        <section>
          <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: th.appFaded, marginBottom: 10 }}>Colore</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {PALETTES.map(p => {
              const c = colori(p.id, temaScuro);
              const isActive = paletteId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { onSelectPalette(p.id); showToast("Aspetto aggiornato"); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                    padding: "8px 10px", borderRadius: 12, cursor: "pointer",
                    background: c.bg, border: `2px solid ${isActive ? c.accent : "transparent"}`,
                    boxShadow: isActive ? `0 0 0 1px ${c.accent}` : `0 0 0 1px ${th.appBorder}`,
                  }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: c.accent, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isActive && <Icon name="fatto" size={12} title="Palette attiva" style={{ color: c.onAccent }}/>}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: c.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 10, color: c.faded, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc}</div>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 2. Tema ───────────────────────────────────────────── */}
        <section>
          <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: th.appFaded, marginBottom: 10 }}>Tema</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[{ v: false, label: "Chiaro" }, { v: true, label: "Scuro" }].map(opt => {
              const isActive = temaScuro === opt.v;
              return (
                <button
                  key={opt.label}
                  onClick={() => { onSelectTemaScuro(opt.v); showToast("Aspetto aggiornato"); }}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer",
                    fontFamily: F.ui, fontSize: 13, fontWeight: 700,
                    background: isActive ? th.appAccent : th.appCard,
                    color: isActive ? th.appOnAccent : th.appInk,
                    border: `1px solid ${isActive ? th.appAccent : th.appBorder}`,
                  }}
                >{opt.label}</button>
              );
            })}
          </div>
          {activePalette.notturna && (
            <div style={{ fontFamily: F.ui, fontSize: 11, color: th.appFaded, marginTop: 8, lineHeight: 1.5 }}>
              {activePalette.nome} è una palette notturna: anche il suo "chiaro" è un fondo scuro.
            </div>
          )}
        </section>

        {/* ── 3. Stile ──────────────────────────────────────────── */}
        <section>
          <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: th.appFaded, marginBottom: 10 }}>Stile</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {UI_STYLES.map(style => {
              const isActive = uiStyleId === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => { onSelectUiStyle(style.id); showToast("Aspetto aggiornato"); }}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div style={{ borderRadius: 14, padding: 8, background: isActive ? th.appPillBg : "transparent", boxShadow: isActive ? `0 0 0 2px ${th.appAccent}` : "none" }}>
                    <StylePreview styleId={style.id} th={th}/>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: isActive ? th.appAccent : th.appInk }}>{style.name}</span>
                    {isActive && <span style={{ display: "inline-flex", color: th.appAccent }}><Icon name="fatto" size={12} title="Stile attivo"/></span>}
                    <span style={{ flex: 1 }}/>
                    <span style={{ fontFamily: F.ui, fontSize: 11, color: th.appFaded }}>{style.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Riepilogo + anteprima ─────────────────────────────── */}
        <section>
          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: th.appInk, marginBottom: 10, textAlign: "center" }}>{summary}</div>
          <StylePreview styleId={uiStyleId} th={th}/>
        </section>

        <div style={{ padding: "12px 14px", borderRadius: 12, background: th.appCard, border: `1px solid ${th.appBorder}` }}>
          <div style={{ fontFamily: F.ui, fontSize: 11, color: th.appFaded, lineHeight: 1.55 }}>
            La scelta vale su questo dispositivo. Negli stili <b>Quaderno</b> e <b>Schedario</b> le
            icone dell'interfaccia sono sempre quelle disegnate; le emoji che hai scelto per le tue
            ricette e le tue sezioni restano come sono.
          </div>
        </div>
      </div>

      <Toast msg={toast.msg} visible={toast.visible}/>
    </div>
  );
}
