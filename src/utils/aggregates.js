// ══════════════════════════════════════════════════════════════
// Risolutore aggregati per il motore di calcolo nutrizionale.
//
// Un ingrediente che appartiene a uno o più aggregati ha, per ciascuna
// caratteristica (categoria, nutrizione, equivalenze), un ORDINE DI
// PRIORITÀ tra le fonti possibili: se stesso ("ingredient") e ciascun
// aggregato di cui è membro. Si scorre l'ordine e si usa la prima fonte
// che possiede il dato; se nessuna lo possiede, il dato resta mancante
// (nessun fallback silenzioso).
//
// sourceByIngredient[ingId] = ["ingredient", aggId, ...] è l'ordine
// personalizzato dall'utente (sparso: esiste solo per gli ingredienti su
// cui è stato personalizzato). Senza personalizzazione, l'ordine di
// default è ["ingredient", ...aggregati di appartenenza in ordine di
// creazione] — così, finché nessuno lo personalizza, il comportamento
// coincide con l'ordine con cui gli aggregati vengono trovati oggi.
//
// Una fonte salvata che non è più valida (aggregato cancellato, o
// ingrediente non più suo membro) viene scartata automaticamente: non
// serve ripulire sourceByIngredient quando si cancella un aggregato o si
// rimuove un membro.
//
// La chiave con cui si salvano i dati di un aggregato è SEMPRE agg.id
// (mai normName(agg.name)): agg.id è generato con uid("agg") ed è per
// costruzione diverso da qualsiasi ID ingrediente, quindi non collide
// mai con un ingrediente che si chiama come l'aggregato.
// ══════════════════════════════════════════════════════════════

// Tutti gli aggregati di cui ingKey è membro (può essere più di uno).
export const aggregatesContaining = (ingKey, aggregates) =>
  (aggregates || []).filter(agg => (agg.members || []).includes(ingKey));

// Ordine di priorità delle fonti per ingKey: "ingredient" oppure un
// agg.id, dal più prioritario al meno. Filtra le fonti salvate non più
// valide e aggiunge in coda le fonti valide non ancora presenti (es. un
// aggregato a cui l'ingrediente è stato aggiunto dopo aver personalizzato
// l'ordine).
export const sourcePriorityFor = (ingKey, aggregates, sourceByIngredient) => {
  const allValid = ["ingredient", ...aggregatesContaining(ingKey, aggregates).map(a => a.id)];
  const stored = (sourceByIngredient || {})[ingKey];
  if (!stored) return allValid;
  const filtered = stored.filter(s => allValid.includes(s));
  const missing = allValid.filter(s => !filtered.includes(s));
  return [...filtered, ...missing];
};

// Risolutore generico: scorre l'ordine di priorità e ritorna la prima
// chiave (ingKey o agg.id) per cui hasOwn(key) è vero. Se nessuna fonte
// possiede il dato, ritorna comunque ingKey (il chiamante gestisce già
// il caso "mancante" leggendo una mappa che non ha quella chiave).
const resolveByPriority = (ingKey, aggregates, sourceByIngredient, hasOwn) => {
  const priority = sourcePriorityFor(ingKey, aggregates, sourceByIngredient);
  for (const src of priority) {
    const key = src === "ingredient" ? ingKey : src;
    if (hasOwn(key)) return key;
  }
  return ingKey;
};

// Chiave da usare per leggere nutritionMap per un dato ingrediente.
export const effectiveNutritionKey = (ingKey, aggregates, nutritionMap, sourceByIngredient) =>
  resolveByPriority(ingKey, aggregates, sourceByIngredient, key => !!(nutritionMap && nutritionMap[key]));

// Stessa logica di effectiveNutritionKey, ma per equivalences.
export const effectiveEquivalenceKey = (ingKey, aggregates, equivalences, sourceByIngredient) =>
  resolveByPriority(ingKey, aggregates, sourceByIngredient, key => !!(equivalences && equivalences[key]));

// Categorie: a differenza di nutrizione/equivalenze, quelle di un
// aggregato non vivono in una mappa condivisa per id ma direttamente su
// agg.categories, quindi qui non restituiamo una "chiave" ma il
// risultato già pronto: le categorie della prima fonte (in ordine di
// priorità) che ne ha. inheritedFrom è l'aggregato da cui si eredita (o
// null se le categorie sono proprie dell'ingrediente), utile per la UI
// ("eredita da «Nome»").
export const effectiveCategories = (ingKey, aggregates, ingredientCategories, sourceByIngredient) => {
  const priority = sourcePriorityFor(ingKey, aggregates, sourceByIngredient);
  for (const src of priority) {
    if (src === "ingredient") {
      const own = (ingredientCategories && ingredientCategories[ingKey]) || [];
      if (own.length > 0) return { categories: own, inheritedFrom: null };
    } else {
      const agg = (aggregates || []).find(a => a.id === src);
      if (agg && (agg.categories || []).length > 0) return { categories: agg.categories, inheritedFrom: agg };
    }
  }
  return { categories: [], inheritedFrom: null };
};
