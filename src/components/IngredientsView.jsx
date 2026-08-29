import React from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import { isSectioned, ingredientToText, ingredientParts, scaleIngredient } from "../utils/helpers.js";
import SectionBadge from "./SectionBadge.jsx";

// Renders ingredients (flat array or sectioned)
export default function IngredientsView({ ingredients, recipeColor, scaleFactor = 1 }) {
  const th = useTheme();
  const ui = useUiStyle();
  if (!ingredients || ingredients.length === 0) return null;
  const scaled = (ing) => scaleFactor !== 1 ? scaleIngredient(ing, scaleFactor) : ing;

  const Row = ({ ing, i }) => {
    if (ui.id === "classico") {
      return (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0", borderBottom:`1px solid ${th.appBorder}` }}>
          <span style={{ color:th.appAccent2, fontSize:13, marginTop:2 }}>✦</span>
          <span style={{ fontFamily:F.body, fontSize:14, color:th.appInk, lineHeight:1.4 }}>{ingredientToText(scaled(ing))}</span>
        </div>
      );
    }
    // quaderno/schedario: nome a sinistra, quantità in F.mono a destra
    const { name, amount, note } = ingredientParts(scaled(ing));
    return (
      <div key={i} style={{
        display:"flex", alignItems:"baseline", gap:10, padding: ui.id==="quaderno" ? "9px 0" : "9px 12px",
        borderBottom: `1px solid ${ui.hairline}`,
        background: ui.id==="schedario" ? ui.card : "transparent",
      }}>
        <span style={{ flex:1, fontFamily:F.body, fontSize:14, color:ui.ink, lineHeight:1.4 }}>
          {name}{note && <span style={{ color:ui.faded }}> ({note})</span>}
        </span>
        {amount && (
          <span style={{ fontFamily:F.mono, fontSize:12.5, color:th.appAccent, flexShrink:0, whiteSpace:"nowrap" }}>{amount}</span>
        )}
      </div>
    );
  };

  if (isSectioned(ingredients)) {
    return (
      <div>
        {ingredients.map((sec, si) => (
          <div key={si}>
            <SectionBadge label={sec.section} color={recipeColor}/>
            {sec.items.map((ing, i) => <Row key={i} ing={ing} i={i}/>)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {ingredients.map((ing, i) => <Row key={i} ing={ing} i={i}/>)}
    </div>
  );
}
