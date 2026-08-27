import { useIconStyle } from "../context.js";
import Icon from "./Icon.jsx";

// Icona dell'interfaccia FISSA (nav, barra azioni, sezioni/categorie
// predefinite) — sceglie tra emoji e SVG in base all'interruttore globale
// gestito da un admin (config/icons, vedi IconStyleCtx in context.js).
// Non va usato per icone scelte liberamente dall'utente (ricette, sezioni/
// categorie personalizzate): quelle restano indipendenti da questo
// interruttore — vedi il picker a due livelli in EmojiColorPicker.jsx.
//
// Se manca `icon` (es. una voce non ancora coperta dal nuovo set) ricade
// sempre sull'emoji, indipendentemente dallo stile attivo.
export default function AppIcon({ emoji, icon, size = 20, style, title }) {
  const iconStyle = useIconStyle();
  if (iconStyle === "svg" && icon) {
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
