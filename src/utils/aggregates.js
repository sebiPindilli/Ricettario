// ══════════════════════════════════════════════════════════════
// Risolutore aggregati per il motore di calcolo nutrizionale.
//
// Regola di prodotto: un ingrediente che appartiene a un aggregato deve
// usare i dati dell'aggregato, non i propri. Priorità: se l'aggregato
// ha il dato (nutrizione o equivalenza) → vince l'aggregato, anche se
// il singolo ingrediente ne aveva uno proprio. Se l'aggregato non ha
// quel dato → si usa il dato del singolo ingrediente. Se nessuno dei
// due ce l'ha → il dato resta mancante (nessun fallback silenzioso).
//
// La chiave con cui si salvano i dati di un aggregato è SEMPRE agg.id
// (mai normName(agg.name)): agg.id è generato con uid("agg") ed è per
// costruzione diverso da qualsiasi ID ingrediente, quindi non collide
// mai con un ingrediente che si chiama come l'aggregato.
//
// Queste funzioni sono pure e non vengono ancora usate da nessuna
// parte dell'app: servono solo come base per le prossime tappe.
// ══════════════════════════════════════════════════════════════

// Trova l'aggregato (se esiste) che include ingKey tra i suoi members.
export const resolveAggregateFor = (ingKey, aggregates) =>
  (aggregates || []).find(agg => (agg.members || []).includes(ingKey)) || null;

// Chiave da usare per leggere nutritionMap per un dato ingrediente:
// agg.id se appartiene a un aggregato che ha già una mappatura propria,
// altrimenti ingKey (il comportamento di oggi, invariato).
export const effectiveNutritionKey = (ingKey, aggregates, nutritionMap) => {
  const agg = resolveAggregateFor(ingKey, aggregates);
  if (agg && nutritionMap && nutritionMap[agg.id]) return agg.id;
  return ingKey;
};

// Stessa logica di effectiveNutritionKey, ma per equivalences.
export const effectiveEquivalenceKey = (ingKey, aggregates, equivalences) => {
  const agg = resolveAggregateFor(ingKey, aggregates);
  if (agg && equivalences && equivalences[agg.id]) return agg.id;
  return ingKey;
};

// Categorie: a differenza di nutrizione/equivalenze, quelle di un
// aggregato non vivono in una mappa condivisa per id ma direttamente
// su agg.categories, quindi qui non restituiamo una "chiave" ma il
// risultato già pronto: le categorie proprie dell'ingrediente se le
// ha, altrimenti quelle ereditate dal suo aggregato (se esiste e ne
// ha), altrimenti nessuna. inheritedFrom è l'aggregato da cui si
// eredita (o null), utile per la UI ("eredita da «Nome»").
export const effectiveCategories = (ingKey, aggregates, ingredientCategories) => {
  const own = (ingredientCategories && ingredientCategories[ingKey]) || [];
  if (own.length > 0) return { categories: own, inheritedFrom: null };
  const agg = resolveAggregateFor(ingKey, aggregates);
  if (agg && (agg.categories || []).length > 0) {
    return { categories: agg.categories, inheritedFrom: agg };
  }
  return { categories: [], inheritedFrom: null };
};
