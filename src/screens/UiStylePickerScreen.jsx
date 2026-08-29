import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { UI_STYLES } from "../data/uiStyles.js";
import BackBtn from "../components/BackBtn.jsx";
import Icon from "../components/Icon.jsx";
import Toast from "../components/Toast.jsx";

// ══════════════════════════════════════════════════════════════
// SCHERMATA: STILE DELL'INTERFACCIA — tre anteprime, una scelta.
//
// Gemella di ThemePickerScreen (che scegle i COLORI): qui si scegle la
// STRUTTURA. Il cambio è immediato e persistito su localStorage dal
// chiamante (vedi src/ricettario-v23.jsx, changeUiStyle).
//
// L'anteprima è un mini-mockup dell'elenco ricette a 3 righe: si vede la
// differenza vera fra card, filetto e card piatta senza aprire l'app.
// ══════════════════════════════════════════════════════════════

const Preview = ({ styleId, th }) => {
  const rows = [
    { color: th.appAccent,  icon: "pasta" },
    { color: th.appAccent2, icon: "torta" },
    { color: "#6B8C6E",     icon: "patata" },
  ];

  // Barra in cima (classico) o in fondo (nuovi stili)
  const navTop = styleId === "classico";
  const navDark = styleId !== "quaderno";

  return (
    <div style={{
      height: 168, borderRadius: 12, overflow: "hidden",
      background: styleId === "quaderno" ? "#FBF9F4" : th.appBg,
      border: `1px solid ${th.appBorder}`,
      display: "flex", flexDirection: "column",
    }}>
      {navTop && (
        <div style={{ display: "flex", gap: 4, background: th.appInk, padding: "6px 5px" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1, height: 12, borderRadius: 3,
              background: i === 0 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
            }}/>
          ))}
        </div>
      )}

      <div style={{ flex: 1, padding: styleId === "quaderno" ? "8px 10px" : "8px 8px", display: "flex", flexDirection: "column", gap: styleId === "quaderno" ? 0 : 6 }}>
        {/* riga ricerca / filtri */}
        <div style={{
          display: "flex", gap: 5, alignItems: "center",
          marginBottom: styleId === "quaderno" ? 7 : 4,
        }}>
          <div style={{
            flex: 1, height: 14, borderRadius: styleId === "classico" ? 7 : 4,
            background: styleId === "quaderno" ? "transparent" : th.appCard,
            borderBottom: styleId === "quaderno" ? `1px solid ${th.appBorder}` : "none",
            border: styleId === "schedario" ? `1px solid ${th.appBorder}` : undefined,
          }}/>
          {styleId !== "classico" && (
            <div style={{ width: 26, height: 14, borderRadius: 4, background: th.appInk }}/>
          )}
        </div>
        {/* fasce di filtri sempre aperte: solo classico */}
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
            background: styleId === "classico" ? th.appCard : styleId === "schedario" ? "#FFFDF8" : "transparent",
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
            {styleId !== "classico" && (
              <div style={{ height: 5, width: 16, borderRadius: 2, background: th.appAccent, opacity: 0.8 }}/>
            )}
          </div>
        ))}
      </div>

      {!navTop && (
        <div style={{
          display: "flex", gap: 4,
          background: navDark ? th.appInk : "transparent",
          borderTop: navDark ? "none" : `1px solid ${th.appBorder}`,
          padding: "6px 5px 7px",
        }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1, height: 10, borderRadius: 3,
              background: navDark
                ? (i === 0 ? th.appAccent2 : "rgba(255,255,255,0.14)")
                : (i === 0 ? th.appInk : th.appBorder),
            }}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default function UiStylePickerScreen({ activeId, onSelect, onBack }) {
  const th = useTheme();
  const [toast, setToast] = useState({ msg: "", visible: false });
  const showToast = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg: "", visible: false }), 2000);
  };

  const handleSelect = (id) => {
    onSelect(id);
    showToast("Stile aggiornato");
  };

  return (
    <div style={{ background: th.appBg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 20px 0" }}><BackBtn onBack={onBack} label="Indietro"/></div>

      <div style={{ padding: "12px 20px 4px" }}>
        <div style={{ fontFamily: F.display, fontSize: 24, color: th.appInk }}>Stile dell'interfaccia</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, marginTop: 4, lineHeight: 1.5 }}>
          Come è disegnata l'app: dove sta la navigazione, quanto pesano le righe, se i filtri
          restano aperti. I colori restano quelli scelti in <b>Stile del libro</b>.
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        {UI_STYLES.map(style => {
          const isActive = activeId === style.id;
          return (
            <button
              key={style.id}
              onClick={() => handleSelect(style.id)}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left",
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              <div style={{
                borderRadius: 14, padding: 8,
                background: isActive ? `${th.appAccent}12` : "transparent",
                boxShadow: isActive ? `0 0 0 2px ${th.appAccent}` : "none",
              }}>
                <Preview styleId={style.id} th={th}/>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: isActive ? th.appAccent : th.appInk }}>
                  {style.name}
                </span>
                {isActive && (
                  <span style={{ display: "inline-flex", color: th.appAccent }}>
                    <Icon name="preferito" size={12} title="Stile attivo"/>
                  </span>
                )}
                <span style={{ flex: 1 }}/>
                <span style={{ fontFamily: F.ui, fontSize: 11, color: th.appFaded }}>{style.desc}</span>
              </div>
            </button>
          );
        })}

        <div style={{
          marginTop: 4, padding: "12px 14px", borderRadius: 12,
          background: th.appCard, border: `1px solid ${th.appBorder}`,
        }}>
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
