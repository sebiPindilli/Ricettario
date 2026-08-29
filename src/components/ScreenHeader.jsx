import { useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import Icon from "./Icon.jsx";
import InfoButton from "./InfoButton.jsx";

// ══════════════════════════════════════════════════════════════
// TESTA DI SCHERMATA — quaderno/schedario, quando la nav è in basso
// (sostituisce la riga 2 "utility bar" di GlobalNav: home, titolo+info,
// export/interruttore schede-libro). Vedi README §Screens 1.
//
// `actions`: array di { icon, label, onClick, tone? } renderizzate come
// icone a destra (es. esporta, schede/libro, aggiungi). `tone:"accent"`
// le disegna su pastiglia colorata (usato per "aggiungi" in schedario).
// ══════════════════════════════════════════════════════════════
export default function ScreenHeader({
  eyebrow, title, subtitle, infoContent,
  onBack, actions = [],
}) {
  const ui = useUiStyle();

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: `14px ${ui.padX}px 6px`,
    }}>
      {onBack && (
        <button onClick={onBack} title="Indietro" style={{
          background: "none", border: "none", cursor: "pointer",
          color: ui.faded, padding: "2px 4px 0 0", flexShrink: 0,
        }}><Icon name="indietro" size={20} /></button>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && (
          <div style={{
            fontFamily: F.ui, fontSize: ui.sectionLabel.size,
            letterSpacing: ui.sectionLabel.spacing, fontWeight: ui.sectionLabel.weight,
            textTransform: "uppercase", color: ui.muted, marginBottom: 2,
          }}>{eyebrow}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontFamily: F.display, fontSize: ui.id === "quaderno" ? 22 : 19,
            color: ui.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{title}</span>
          {infoContent && <InfoButton>{infoContent}</InfoButton>}
        </div>
        {subtitle && (
          <div style={{ fontFamily: F.ui, fontSize: 11.5, color: ui.faded, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>

      {actions.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, paddingTop: 2 }}>
          {actions.map((a, i) => (
            <button key={i} onClick={a.onClick} title={a.label} style={
              a.tone === "accent"
                ? {
                    width: 34, height: 34, borderRadius: ui.radius.control - 1,
                    background: ui.accent, border: "none", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }
                : {
                    background: "none", border: "none", cursor: "pointer",
                    color: a.active ? ui.accent : ui.faded, padding: 4,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }
            }>
              <Icon name={a.icon} size={a.tone === "accent" ? 17 : 19} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
