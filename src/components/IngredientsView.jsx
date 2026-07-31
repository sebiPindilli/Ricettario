import React from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { isSectioned, ingredientToText, scaleIngredient } from "../utils/helpers.js";
import SectionBadge from "./SectionBadge.jsx";

// Renders ingredients (flat array or sectioned)
export default function IngredientsView({ ingredients, recipeColor, scaleFactor = 1 }) {
  const th = useTheme();
  if (!ingredients || ingredients.length === 0) return null;
  const showIng = (ing) => scaleFactor !== 1 ? ingredientToText(scaleIngredient(ing, scaleFactor)) : ingredientToText(ing);

  if (isSectioned(ingredients)) {
    return (
      <div>
        {ingredients.map((sec, si) => (
          <div key={si}>
            <SectionBadge label={sec.section} color={recipeColor}/>
            {sec.items.map((ing, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0", borderBottom:`1px solid ${th.appBorder}` }}>
                <span style={{ color:th.appAccent2, fontSize:13, marginTop:2 }}>✦</span>
                <span style={{ fontFamily:F.body, fontSize:14, color:th.appInk, lineHeight:1.4 }}>{showIng(ing)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {ingredients.map((ing, i) => (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0", borderBottom:`1px solid ${th.appBorder}` }}>
          <span style={{ color:th.appAccent2, fontSize:13, marginTop:2 }}>✦</span>
          <span style={{ fontFamily:F.body, fontSize:14, color:th.appInk, lineHeight:1.4 }}>{showIng(ing)}</span>
        </div>
      ))}
    </div>
  );
}
