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

// Alias — stessa identica forma di dato (array di oggetti con id, diff per
// riferimento) e stessa identica logica: le voci della lista spesa (Fase C,
// vedi flushShoppingListNow in ricettario-v23.jsx) sono strutturalmente
// indistinguibili dalle ricette per questo scopo. Nessuna nuova
// implementazione: sarebbe una copia letterale di diffRecipes/recipesToMap.
export const diffShoppingEntries = diffRecipes;
export const shoppingEntriesToMap = recipesToMap;

// ── Diff del documento "system" (Organizza Ingredienti) — gestione
// conflitti multi-utente, documento unico per 12 proprietà (vedi
// saveBookSystem in src/services/bookStore.js). Stessa idea di diffRecipes:
// si scrive solo ciò che è davvero cambiato, non l'istantanea intera —
// qui però il documento ha due forme di dato diverse, con granularità di
// diff diversa per ciascuna:
//
// - campi-mappa (dizionario chiave→valore, es. nutritionMap[idIngrediente]):
//   Firestore aggiorna UNA sola chiave via percorso puntato
//   ("nutritionMap.pomodoro") senza toccare le altre — quindi il diff è
//   per singola voce, la stessa granularità usata per rilevare i conflitti
//   in scrittura (due client che toccano chiavi diverse dello stesso campo
//   non si scontrano mai).
//
// - campi-lista (array con una chiave logica, es. aggregates[i].id):
//   Firestore NON supporta l'aggiornamento di un singolo elemento dentro un
//   array via percorso puntato — una scrittura su un campo-lista sostituisce
//   sempre l'intero array. Il diff è quindi sull'intero campo, per
//   riferimento (stessa garanzia di diffRecipes: un cambiamento vero produce
//   sempre un nuovo riferimento, grazie alla disciplina di update immutabili
//   già in uso in tutti gli handler di AppInner).
//   Limite accettato, non nascosto: due modifiche concorrenti a ELEMENTI
//   DIVERSI dello stesso campo-lista vengono trattate come conflitto sullo
//   stesso campo, anche se non si sovrappongono davvero. I campi-lista
//   cambiano molto meno spesso dei campi-mappa (categorie/sezioni/aggregati
//   vs. una voce di dizionario ingredienti ad ogni categorizzazione).
export const MAP_SYSTEM_FIELDS = [
  "ingredientCategories", "equivalences", "customUnits",
  "nutritionMap", "ingredientDict", "sourceByIngredient",
];

export const ARRAY_SYSTEM_FIELDS = [
  "extraTagGroups", "sectionList", "categoryList",
  "aggregates", "customFoods", "ignoredSimilarities",
  "allergenGroups", "ignoredAllergenSuggestions",
];

// lastSynced/current: oggetto con le 12 proprietà del documento system
// (stessa forma di snapshotData() meno recipes/shoppingList).
// → { mapChanges: { [campo]: { changed:{chiave:valore,...}, removedKeys:[...] } },
//     changedArrayFields: [nomi dei campi-lista cambiati per riferimento] }
// Un campo-mappa compare in mapChanges solo se ha almeno una voce
// cambiata/rimossa — un ciclo "nessuna modifica" produce un oggetto vuoto,
// non 6 voci vuote.
export const diffSystemFields = (lastSynced, current) => {
  const mapChanges = {};
  MAP_SYSTEM_FIELDS.forEach((field) => {
    const before = lastSynced?.[field] || {};
    const after = current?.[field] || {};
    const afterKeys = new Set(Object.keys(after));
    const changed = {};
    afterKeys.forEach((k) => {
      if (before[k] !== after[k]) changed[k] = after[k];
    });
    const removedKeys = Object.keys(before).filter((k) => !afterKeys.has(k));
    if (Object.keys(changed).length > 0 || removedKeys.length > 0) {
      mapChanges[field] = { changed, removedKeys };
    }
  });

  const changedArrayFields = ARRAY_SYSTEM_FIELDS.filter(
    (field) => lastSynced?.[field] !== current?.[field]
  );

  return { mapChanges, changedArrayFields };
};

// Confronto per valore (non per riferimento) — usato dalla scrittura online
// a grana fine per decidere se una voce letta ora dal server è ancora
// quella che il client si aspettava di trovare (vedi saveSystemEntriesOnline
// in src/services/bookStore.js): un confronto per riferimento non
// funzionerebbe lì, perché il valore "atteso" arriva da uno stato locale e
// quello "attuale" da una lettura Firestore appena decodificata — riferimenti
// sempre diversi anche a contenuto identico. Dati sempre JSON-sicuri
// (stringhe/numeri/array/oggetti semplici, mai funzioni o cicli), un
// confronto ricorsivo semplice basta.
export const deepEqual = (a, b) => {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
};
