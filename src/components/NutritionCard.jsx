import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import SuggestionHint from "./SuggestionHint.jsx";
import { NUTRITION_DB, NUTRIENT_LABELS } from "../data/nutrition.js";
import { normName, ingDictIndex, resolveIngId, flattenIngredients } from "../utils/helpers.js";
import { effectiveNutritionKey } from "../utils/aggregates.js";
import { computeRecipeNutrition } from "../utils/recipeNutrition.js";

// ══════════════════════════════════════════════════════════════
// NUTRITION CARD — tabella valori nella scheda ricetta
// ══════════════════════════════════════════════════════════════
export default function NutritionCard({ recipe, nutritionMap = {}, equivalences = {}, customUnits = {}, customFoods = [], ingredientDict = null, aggregates = [], sourceByIngredient = {}, standalone = false, onManageEquivalences = null, onManageIngredients = null }) {
  const th = useTheme();
  const [open, setOpen] = useState(standalone);
  const [view, setView] = useState("serving"); // "serving" | "per100" | "total"

  const nutri = React.useMemo(
    () => computeRecipeNutrition(recipe, nutritionMap, equivalences, customFoods, ingredientDict, aggregates, sourceByIngredient, customUnits),
    [recipe, nutritionMap, equivalences, customFoods, ingredientDict, aggregates, sourceByIngredient, customUnits]
  );
  // Conta gli ingredienti mappati (anche se non convertibili in grammi)
  const mappedCount = React.useMemo(() => {
    const dbByName = new Map([...NUTRITION_DB, ...customFoods].map(f => [normName(f.name), f]));
    const idx = ingredientDict ? ingDictIndex(ingredientDict) : null;
    return flattenIngredients(recipe.ingredients).filter(ing => {
      const key = effectiveNutritionKey(resolveIngId(idx, ing.name), aggregates, nutritionMap, sourceByIngredient);
      return nutritionMap[key] || dbByName.has(normName(ing.name));
    }).length;
  }, [recipe, nutritionMap, customFoods, ingredientDict, aggregates, sourceByIngredient]);

  if (nutri.covered === 0 && mappedCount === 0) return null; // nessuna mappatura: nulla da mostrare

  const hasNonConvertible = nutri.details.some(d => d.status === "nounit");
  const hasUnlinked = nutri.details.some(d => d.status === "unlinked");
  const linkStyle = { color:th.appAccent, fontWeight:700, cursor:"pointer", textDecoration:"underline", textUnderlineOffset:2 };
  const hintsBox = (
    ((hasNonConvertible && onManageEquivalences) || (hasUnlinked && onManageIngredients)) && (
      <div>
        {hasNonConvertible && onManageEquivalences && (
          <SuggestionHint>
            <span style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5 }}>
              ⚖️* Alcuni ingredienti usano un'unità senza un'equivalenza in grammi definita (es. 1 cucchiaio = ? g): per un funzionamento ottimale{" "}
              <span onClick={() => onManageEquivalences(recipe.id)} style={linkStyle}>gestisci le equivalenze mancanti di questa ricetta</span>.
            </span>
          </SuggestionHint>
        )}
        {hasUnlinked && onManageIngredients && (
          <SuggestionHint>
            <span style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5 }}>
              🍎* Alcuni ingredienti non sono ancora collegati a un valore nutrizionale: per un funzionamento ottimale{" "}
              <span onClick={() => onManageIngredients(recipe.id)} style={linkStyle}>gestisci i valori nutrizionali mancanti di questa ricetta</span>.
            </span>
          </SuggestionHint>
        )}
      </div>
    )
  );

  // Mappature presenti ma nessuna quantità convertibile in grammi → guida invece della tabella
  if (nutri.covered === 0) {
    return (
      <div style={{ marginTop:14, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:14, padding:"12px 14px" }}>
        <div style={{ fontFamily:F.ui, fontSize:12, fontWeight:700, color:th.appInk, marginBottom:6 }}>🍎 Valori nutrizionali</div>
        {hintsBox}
        {nutri.details.map((d, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:8, fontFamily:F.ui, fontSize:10.5, lineHeight:1.7, color:th.appFaded }}>
            <span style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {d.status === "noqty" || d.status === "optout" ? "·" : "○"} {d.name}
            </span>
            <span style={{ flexShrink:0, fontStyle:"italic" }}>
              {d.status === "noqty" ? "q.b."
                : d.status === "optout" ? "escluso (0%)"
                : d.status === "nounit" ? `"${d.unit || "?"}" non convertibile${onManageEquivalences ? " ⚖️*" : ""}`
                : `non collegato${onManageIngredients ? " 🍎*" : ""}`}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const vals = view === "per100" ? nutri.per100 : nutri.perServing;
  const fmt = (v, dec) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10**dec) / 10**dec).replace(".", ",");

  return (
    <div style={{ marginTop: standalone ? 0 : 14, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:14, overflow:"hidden" }}>
      <button onClick={() => { if (!standalone) setOpen(o => !o); }} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 14px", background:"none", border:"none", cursor: standalone ? "default" : "pointer",
      }}>
        <span style={{ fontFamily:F.ui, fontSize:12, fontWeight:700, color:th.appInk }}>
          🍎 Valori nutrizionali
          <span style={{ fontWeight:400, color:th.appFaded }}> · {fmt(nutri.perServing.kcal, 0)} kcal/porzione</span>
        </span>
        {!standalone && <span style={{ color:th.appFaded, fontSize:12 }}>{open ? "▴" : "▾"}</span>}
      </button>

      {open && (
        <div style={{ padding:"0 14px 12px" }}>
          <div style={{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" }}>
            {[["Per porzione","serving"], ["Per 100 g","per100"]].map(([label, v]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:"5px 11px", borderRadius:14,
                border:`1.5px solid ${view === v ? th.appAccent : th.appBorder}`,
                background: view === v ? th.appAccent : "transparent",
                color: view === v ? "#fff" : th.appFaded,
                fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer",
              }}>{label}</button>
            ))}
          </div>
          {view === "per100" && (
            <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginBottom:8 }}>
              su {fmt(nutri.totalGrams, 0)} g totali di ingredienti calcolati (a crudo)
            </div>
          )}

          {NUTRIENT_LABELS.map(({ key, label, unit, dec, sub }) => (
            <div key={key} style={{
              display:"flex", justifyContent:"space-between",
              padding: sub ? "3px 0 3px 16px" : "5px 0",
              borderBottom:`1px solid ${th.appBorder}55`,
              fontFamily:F.body, fontSize: sub ? 12 : 13.5,
              color: sub ? th.appFaded : th.appInk,
            }}>
              <span>{label}</span>
              <span style={{ fontWeight: sub ? 400 : 700 }}>{fmt(vals[key], dec)} {unit}</span>
            </div>
          ))}

          {/* Sintesi per ingrediente — quantità scalate alla vista corrente */}
          <div style={{ marginTop:10 }}>
            <div style={{ fontFamily:F.ui, fontSize:9.5, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:5 }}>
              Ingredienti nel calcolo · {view === "per100" ? "per 100 g" : "per porzione"}
            </div>
            {nutri.details.map((d, i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", gap:8,
                fontFamily:F.ui, fontSize:10.5, lineHeight:1.7,
                color: d.status === "ok" ? th.appInk : th.appFaded,
              }}>
                <span style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {d.status === "ok" ? "✓" : d.status === "noqty" || d.status === "optout" ? "·" : "○"} {d.name}
                  {d.status === "ok" && (
                    <span style={{
                      display:"inline-block", marginLeft:5, padding:"0 5px", borderRadius:6,
                      fontSize:8.5, fontWeight:700, verticalAlign:"middle",
                      background: d.pct < 100 ? `${th.appAccent}22` : `${th.appBorder}66`,
                      color: d.pct < 100 ? th.appAccent : th.appFaded,
                    }} title="Pesatura nel calcolo nutrizionale">{d.pct != null ? d.pct : 100}%</span>
                  )}
                  {d.status === "optout" && (
                    <span style={{ display:"inline-block", marginLeft:5, padding:"0 5px", borderRadius:6, fontSize:8.5, fontWeight:700, verticalAlign:"middle", background:`${th.appBorder}66`, color:th.appFaded }}>0%</span>
                  )}
                  {d.status === "ok" && d.foodName && d.foodName !== "valori manuali" && normName(d.foodName) !== normName(d.name) && (
                    <span style={{ opacity:0.6 }}> → {d.foodName}</span>
                  )}
                </span>
                <span style={{ flexShrink:0, fontStyle: d.status === "ok" ? "normal" : "italic" }}>
                  {d.status === "ok" ? (() => {
                      const factor = view === "serving" ? 1 / (recipe.servings > 0 ? recipe.servings : 1)
                                   : view === "per100"  ? (nutri.totalGrams > 0 ? 100 / nutri.totalGrams : 0)
                                   : 1;
                      const g = d.grams * factor;
                      return `${fmt(g, g < 10 ? 1 : 0)} g`;
                    })()
                    : d.status === "noqty" ? "q.b. — non conteggiato"
                    : d.status === "optout" ? "escluso dal calcolo (0%)"
                    : d.status === "nounit" ? `"${d.unit || "?"}" non convertibile${onManageEquivalences ? " ⚖️*" : ""}`
                    : `non collegato${onManageIngredients ? " 🍎*" : ""}`}
                </span>
              </div>
            ))}
          </div>
          {hintsBox && (
            <div style={{ marginTop:8 }}>{hintsBox}</div>
          )}
          <div style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded, marginTop:8, textAlign:"center" }}>
            Valori indicativi — elaborazione da Tabelle CREA (alimentinutrizione.it)
          </div>
        </div>
      )}
    </div>
  );
}
