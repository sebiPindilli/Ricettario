import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { NUTRITION_DB, NUTRIENT_LABELS } from "../data/nutrition.js";
import { normName, ingDictIndex, resolveIngId, flattenIngredients, ingredientToGrams } from "../utils/helpers.js";
import { effectiveNutritionKey } from "../utils/aggregates.js";

// ── Calcolo nutrizionale di una ricetta ──
// nutritionMap: { "<nome normalizzato>": { foodId } | { custom:{kcal,...} } }
// Ritorna { total, perServing, covered, excluded:[{name, reason}] }
const computeRecipeNutrition = (recipe, nutritionMap = {}, equivalences = {}, customFoods = [], ingredientDict = null, aggregates = [], sourceByIngredient) => {
  const dictIdx = ingredientDict ? ingDictIndex(ingredientDict) : null;
  const allFoods = [...NUTRITION_DB, ...customFoods];
  const dbById = new Map(allFoods.map(f => [f.id, f]));
  const dbByName = new Map(allFoods.map(f => [normName(f.name), f]));
  const total = { kcal:0, carb:0, sug:0, prot:0, fat:0, sat:0, fib:0, salt:0 };
  const excluded = [];
  let covered = 0;
  let totalGrams = 0;

  const details = []; // sintesi per-ingrediente: incluso/escluso e perché
  flattenIngredients(recipe.ingredients).forEach(ing => {
    const key = resolveIngId(dictIdx, ing.name);
    // Se l'ingrediente appartiene a un aggregato con nutrizione propria,
    // usa quella (agg.id); altrimenti resta la chiave del singolo.
    const effKey = effectiveNutritionKey(key, aggregates, nutritionMap, sourceByIngredient);
    const mapping = nutritionMap[effKey];
    // 1) mappatura esplicita → 2) match esatto sul nome del database
    const values = mapping?.custom
      ? mapping.custom
      : mapping?.foodId
        ? dbById.get(mapping.foodId)
        : dbByName.get(normName(ing.name));
    const foodName = mapping?.custom ? "valori manuali" : values?.name;
    if (ing.qty == null) {
      // q.b. / senza dose: irrilevante per il computo
      details.push({ name: ing.name, status: "noqty" });
      return;
    }
    if (!values) {
      excluded.push({ name: ing.name, reason: "non collegato" });
      details.push({ name: ing.name, status: "unlinked" });
      return;
    }
    const grams = ingredientToGrams(ing, equivalences, dictIdx, aggregates, sourceByIngredient);
    if (grams == null) {
      excluded.push({ name: ing.name, reason: `unità "${ing.unit || "?"}" non convertibile in grammi` });
      details.push({ name: ing.name, status: "nounit", unit: ing.unit, foodName });
      return;
    }
    // Percentuale che resta nel prodotto finale (default 100)
    const pct = typeof ing.nutriPct === "number" ? Math.max(0, Math.min(100, ing.nutriPct)) : 100;
    if (pct === 0) {
      details.push({ name: ing.name, status: "optout" });
      return;
    }
    const effGrams = grams * pct / 100;
    covered++;
    totalGrams += effGrams;
    details.push({ name: ing.name, status: "ok", grams: effGrams, foodName, pct });
    Object.keys(total).forEach(k => { total[k] += (values[k] || 0) * effGrams / 100; });
  });

  const servings = recipe.servings > 0 ? recipe.servings : 1;
  const perServing = {};
  Object.keys(total).forEach(k => { perServing[k] = total[k] / servings; });
  const per100 = {};
  Object.keys(total).forEach(k => { per100[k] = totalGrams > 0 ? total[k] * 100 / totalGrams : 0; });
  return { total, perServing, per100, totalGrams, covered, excluded, details };
};

// ══════════════════════════════════════════════════════════════
// NUTRITION CARD — tabella valori nella scheda ricetta
// ══════════════════════════════════════════════════════════════
export default function NutritionCard({ recipe, nutritionMap = {}, equivalences = {}, customFoods = [], ingredientDict = null, aggregates = [], sourceByIngredient = {}, standalone = false }) {
  const th = useTheme();
  const [open, setOpen] = useState(standalone);
  const [view, setView] = useState("serving"); // "serving" | "per100" | "total"

  const nutri = React.useMemo(
    () => computeRecipeNutrition(recipe, nutritionMap, equivalences, customFoods, ingredientDict, aggregates, sourceByIngredient),
    [recipe, nutritionMap, equivalences, customFoods, ingredientDict, aggregates, sourceByIngredient]
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

  // Mappature presenti ma nessuna quantità convertibile in grammi → guida invece della tabella
  if (nutri.covered === 0) {
    return (
      <div style={{ marginTop:14, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:14, padding:"12px 14px" }}>
        <div style={{ fontFamily:F.ui, fontSize:12, fontWeight:700, color:th.appInk, marginBottom:6 }}>🍎 Valori nutrizionali</div>
        <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.55, marginBottom:8 }}>
          {mappedCount} ingredient{mappedCount===1?"e è collegato":"i sono collegati"} al database, ma nessuna quantità è convertibile in grammi.
          Definisci i fattori (es. 1 cucchiaio = 10 g) in ⚙️ Organizza › ⚖️ Organizza equivalenze.
        </div>
        {nutri.details.map((d, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:8, fontFamily:F.ui, fontSize:10.5, lineHeight:1.7, color:th.appFaded }}>
            <span style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {d.status === "noqty" || d.status === "optout" ? "·" : "○"} {d.name}
            </span>
            <span style={{ flexShrink:0, fontStyle:"italic" }}>
              {d.status === "noqty" ? "q.b." : d.status === "optout" ? "escluso (0%)" : d.status === "nounit" ? `"${d.unit || "?"}" non convertibile` : "non collegato"}
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
                    : d.status === "nounit" ? `"${d.unit || "?"}" non convertibile`
                    : "non collegato"}
                </span>
              </div>
            ))}
          </div>
          {nutri.excluded.length > 0 && (
            <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:8, lineHeight:1.5 }}>
              ⚠ Per includere gli esclusi: ⚙️ Organizza › 🍎 Valori nutrizionali (collegamenti) o ⚖️ Equivalenze (unità).
            </div>
          )}
          <div style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded, marginTop:8, textAlign:"center" }}>
            Valori indicativi — elaborazione da Tabelle CREA (alimentinutrizione.it)
          </div>
        </div>
      )}
    </div>
  );
}
