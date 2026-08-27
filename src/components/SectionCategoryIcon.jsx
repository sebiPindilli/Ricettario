import AppIcon from "./AppIcon.jsx";
import ChosenIcon from "./ChosenIcon.jsx";
import { isBuiltInIcon } from "../utils/iconHelpers.js";

// Icona di una sezione o categoria ingredienti (predefinita o creata
// dall'utente) — sceglie da sé se deve seguire l'interruttore globale
// admin (voce predefinita mai toccata, vedi isBuiltInIcon) o l'eventuale
// icona/emoji scelta liberamente dall'utente (sempre rispettata).
export default function SectionCategoryIcon({ item, size = 18, style }) {
  return isBuiltInIcon(item)
    ? <AppIcon emoji={item.emoji} icon={item.icon} size={size} style={style} />
    : <ChosenIcon emoji={item.emoji} icon={item.icon} size={size} style={style} />;
}
