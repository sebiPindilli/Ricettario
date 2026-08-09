// Diff per riferimento tra l'ultimo stato ricette sincronizzato su Firestore
// e lo stato attuale in memoria — permette di salvare solo ciò che è
// realmente cambiato invece di riscrivere l'intero libro ad ogni modifica
// (vedi src/ricettario-v23.jsx, effetto dedicato allo stato "recipes").
//
// Si basa sulla disciplina di update immutabili già in uso in tutti gli
// handler di AppInner ("tocca solo l'oggetto che cambia", vedi updateRecipe/
// deleteSection): una ricetta davvero modificata ha SEMPRE un riferimento
// diverso da prima (altrimenti React non la re-renderizzerebbe nemmeno),
// quindi il diff per riferimento non può mai perdere una modifica reale —
// nel peggiore dei casi (un handler che spacchetta più ricette del
// necessario, come renameIngredient prima della correzione) produce
// scritture di troppo, mai scritture mancanti.

// lastSynced: Map<id, recipeRef> — cosa risulta scritto su Firestore
// currentRecipes: array delle ricette attuali in stato React
// → { changed: Recipe[] (creati o modificati), removedIds: string[] (eliminati) }
export const diffRecipes = (lastSynced, currentRecipes) => {
  const changed = [];
  const currentIds = new Set();
  currentRecipes.forEach((r) => {
    currentIds.add(r.id);
    if (lastSynced.get(r.id) !== r) changed.push(r);
  });
  const removedIds = [];
  lastSynced.forEach((_, id) => {
    if (!currentIds.has(id)) removedIds.push(id);
  });
  return { changed, removedIds };
};

// Istantanea "ultimo stato sincronizzato" da usare come base per il
// prossimo diff, dopo un caricamento o un salvataggio riuscito.
export const recipesToMap = (recipes) => new Map(recipes.map((r) => [r.id, r]));
