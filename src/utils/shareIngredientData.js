// Costruisce il sottoinsieme di "Organizza Ingredienti" pertinente a UNA
// ricetta, per la condivisione via link (vedi sharedRecipesStore.js).
//
// La copia di ricette in un altro proprio ricettario (copyRecipesToBooks in
// ricettario-v23.jsx), con "includi impostazioni", copia l'INTERO libro —
// ha senso lì (si copia in un ricettario), ma per il link di una singola
// ricetta sarebbe eccessivo:
// rivelerebbe categorie/nutrizione/equivalenze di ingredienti non
// pertinenti e gonfierebbe il documento condiviso. Qui si filtra a ciò che
// serve davvero per quella ricetta: i suoi ingredienti, gli aggregati a cui
// appartengono, e le sole unità personalizzate che usa.
import {
  flattenIngredients, ingDictIndex, resolveIngId, normUnit,
} from "./helpers.js";

export function buildRecipeIngredientData(recipe, systemState) {
  const {
    ingredientDict = {}, ingredientCategories = {}, aggregates = [],
    equivalences = {}, customUnits = {}, nutritionMap = {},
    customFoods = [], sourceByIngredient = {},
  } = systemState || {};

  const dictIdx = ingDictIndex(ingredientDict);
  const flat = flattenIngredients(recipe.ingredients);
  const ingIds = new Set(flat.map(ing => resolveIngId(dictIdx, ing.name)));
  const units = new Set(flat.map(ing => normUnit(ing.unit)).filter(Boolean));

  // Aggregati a cui appartiene almeno un ingrediente della ricetta —
  // nutrizione/equivalenze/categorie possono essere ereditate da lì
  // (vedi effectiveNutritionKey e affini in utils/aggregates.js).
  const relevantAggregates = aggregates.filter(agg => (agg.members || []).some(m => ingIds.has(m)));

  const relevantKeys = new Set(ingIds);
  relevantAggregates.forEach(agg => relevantKeys.add(agg.id));

  const pick = (obj, keys) =>
    Object.fromEntries(Object.entries(obj || {}).filter(([k]) => keys.has(k)));

  const outIngredientDict = {};
  ingIds.forEach(id => { if (ingredientDict[id] != null) outIngredientDict[id] = ingredientDict[id]; });

  const outNutritionMap = pick(nutritionMap, relevantKeys);
  const outEquivalences = pick(equivalences, relevantKeys);
  const outIngredientCategories = pick(ingredientCategories, ingIds);
  const outSourceByIngredient = pick(sourceByIngredient, ingIds);
  const outCustomUnits = pick(customUnits, units);

  const foodIds = new Set(Object.values(outNutritionMap).map(v => v?.foodId).filter(Boolean));
  const outCustomFoods = customFoods.filter(f => foodIds.has(f.id));

  const hasAnything = relevantAggregates.length > 0
    || Object.keys(outNutritionMap).length > 0
    || Object.keys(outEquivalences).length > 0
    || Object.keys(outIngredientCategories).length > 0
    || outCustomFoods.length > 0
    || Object.keys(outCustomUnits).length > 0;
  if (!hasAnything) return null;

  return {
    ingredientDict: outIngredientDict,
    ingredientCategories: outIngredientCategories,
    aggregates: relevantAggregates,
    equivalences: outEquivalences,
    customUnits: outCustomUnits,
    nutritionMap: outNutritionMap,
    customFoods: outCustomFoods,
    sourceByIngredient: outSourceByIngredient,
  };
}
