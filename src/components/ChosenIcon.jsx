import Icon from "./Icon.jsx";

// Icona scelta LIBERAMENTE dall'utente (ricetta, sezione/categoria
// personalizzata) — a differenza di AppIcon.jsx, NON dipende
// dall'interruttore globale emoji/SVG dell'admin: una volta scelta
// un'icona SVG per la propria ricetta resta tale sempre, e viceversa.
// Vedi anche isBuiltInIcon in utils/iconHelpers.js, che decide QUALE dei
// due componenti usare per le sezioni/categorie predefinite (che possono
// restare "fisse", governate da AppIcon, finché non vengono personalizzate).
export default function ChosenIcon({ emoji, icon, size = 20, style, title }) {
  if (icon) {
    return <Icon name={icon} size={size} style={style} title={title} />;
  }
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      style={{ fontSize: size, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, ...style }}
    >
      {emoji}
    </span>
  );
}
