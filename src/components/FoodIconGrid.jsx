import { FOOD_ICON_GROUPS } from "../data/foodIcons.js";
import Icon from "./Icon.jsx";
import { F } from "../data/constants.js";

// Griglia delle ~150 icone SVG "di contenuto" (cibo/piatti/utensili…),
// raggruppate come nel catalogo del set — riusata dal secondo livello
// (scheda "SVG") di ogni picker icona personalizzabile: ricetta
// (EmojiColorPicker.jsx), sezione (SectionPicker.jsx), categoria
// ingredienti (OrganizeIngredientsScreen.jsx).
export default function FoodIconGrid({ value, onSelect, accent = "#C4593A", inkColor = "#2C2416", fadedColor = "#7A6E5F", borderColor = "#EDE6D4", bgColor = "#F7F2E8" }) {
  return (
    <div style={{ maxHeight: 260, overflowY: "auto" }}>
      {FOOD_ICON_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: F.ui, fontSize: 9.5, letterSpacing: 1, color: fadedColor, textTransform: "uppercase", marginBottom: 5 }}>{group.label}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {group.icons.map(name => (
              <button key={name} onClick={() => onSelect(name)} title={name} style={{
                aspectRatio: "1", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${value === name ? accent : borderColor}`,
                background: value === name ? `${accent}18` : bgColor,
                color: value === name ? accent : inkColor,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={name} size={19} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
