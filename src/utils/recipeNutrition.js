// Calcolo nutrizionale di una ricetta — estratto da NutritionCard.jsx così
// da poter essere richiamato anche fuori da React (l'export PDF in
// ricettario-v23.jsx è puro JS, non un componente): un'unica implementazione,
// mai duplicata tra scheda ricetta in app ed export.
// nutritionMap: { "<nome normalizzato>": { foodId } | { custom:{kcal,...} } }
// Ritorna { total, perServing, per100, totalGrams, covered, excluded, details, incomplete }
// incomplete: { <nutriente>: bool } — true se almeno un ingrediente incluso nel
// computo ha quel nutriente non disponibile (null) nella propria fonte. In tal
// caso il totale per quel nutriente NON è affidabile (manca un contributo reale,
// non zero): va mostrato come "n/d", mai come se fosse un numero completo.
import { NUTRITION_DB } from "../data/nutrition.js";
import { normName, ingDictIndex, resolveIngId, flattenIngredients, ingredientToGrams, buildFoodNameIndex } from "./helpers.js";
import { effectiveNutritionKey } from "./aggregates.js";

export const computeRecipeNutrition = (recipe, nutritionMap = {}, equivalences = {}, customFoods = [], ingredientDict = null, aggregates = [], sourceByIngredient, customUnits = {}) => {
  const dictIdx = ingredientDict ? ingDictIndex(ingredientDict) : null;
  const allFoods = [...NUTRITION_DB, ...customFoods];
  const dbById = new Map(allFoods.map(f => [f.id, f]));
  const dbByName = buildFoodNameIndex(allFoods);
  const total = { kcal:0, carb:0, sug:0, prot:0, fat:0, sat:0, fib:0, salt:0 };
  const incomplete = { kcal:false, carb:false, sug:false, prot:false, fat:false, sat:false, fib:false, salt:false };
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
    const grams = ingredientToGrams(ing, equivalences, dictIdx, aggregates, sourceByIngredient, customUnits);
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
    Object.keys(total).forEach(k => {
      if (values[k] == null) { incomplete[k] = true; return; }
      total[k] += values[k] * effGrams / 100;
    });
  });

  const servings = recipe.servings > 0 ? recipe.servings : 1;
  const perServing = {};
  Object.keys(total).forEach(k => { perServing[k] = total[k] / servings; });
  const per100 = {};
  Object.keys(total).forEach(k => { per100[k] = totalGrams > 0 ? total[k] * 100 / totalGrams : 0; });
  return { total, perServing, per100, totalGrams, covered, excluded, details, incomplete };
};
