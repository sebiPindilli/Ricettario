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

// ══════════════════════════════════════════════════════════════
// Rilevamento automatico di ingredienti dal nome simile — suggerisce
// possibili aggregati da creare (es. "pomodoro" / "pomodori pelati").
// ══════════════════════════════════════════════════════════════

const SIMILARITY_STOPWORDS = new Set([
  "di", "al", "con", "in", "il", "la", "lo", "le", "gli",
  "del", "della", "allo", "alla",
]);

// Parole "significative" di un nome: minuscole, lunghe almeno 4 lettere,
// escluse le funzionali sopra (articoli/preposizioni non discriminano).
const significantWords = (name) =>
  (name || "").toLowerCase().split(/\s+/).filter(w => w.length >= 4 && !SIMILARITY_STOPWORDS.has(w));

// Distanza di Levenshtein standard (programmazione dinamica).
const levenshteinDistance = (a, b) => {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

// Soglia di Levenshtein adattiva sulla lunghezza del nome più corto.
const levenshteinThreshold = (len) => (len <= 5 ? 1 : len <= 10 ? 2 : 3);

// Due nomi sono "simili" se condividono la prima parola significativa,
// oppure 2+ parole significative, oppure sono a distanza di Levenshtein
// entro soglia sul nome intero (case-insensitive). Esportata: riusata anche
// da findAllergenSuggestions qui sotto, stessa euristica.
export const namesAreSimilar = (nameA, nameB) => {
  const wordsA = significantWords(nameA), wordsB = significantWords(nameB);
  if (wordsA.length && wordsB.length && wordsA[0] === wordsB[0]) return true;
  const common = wordsA.filter(w => wordsB.includes(w));
  if (common.length >= 2) return true;
  const a = (nameA || "").toLowerCase(), b = (nameB || "").toLowerCase();
  const threshold = levenshteinThreshold(Math.min(a.length, b.length));
  return levenshteinDistance(a, b) <= threshold;
};

// findSimilarIngredients: individua coppie di ingredienti dal nome simile,
// le raggruppa in cluster transitivi (A~B, B~C → {A,B,C}) e restituisce una
// lista di gruppi suggeriti: [{ key, type, label, members, pairs, ... }].
// - key: identità stabile del gruppo (membri ordinati, uniti)
// - members: ID ingrediente (dizionario), TUTTI i membri del cluster
// - pairs: le coppie [ingIdA, ingIdB] che hanno generato il gruppo — servono
//   per poter ignorare/ripristinare esattamente le relazioni rilevate, non
//   tutte le combinazioni possibili tra i membri del cluster.
// Un cluster può toccare un aggregato già esistente (es. hai creato "Olio"
// da due dei tre oli simili rilevati): l'unione via un membro non ancora
// aggregato ("olio di semi") continua a legare insieme anche i membri già
// dentro l'aggregato, quindi il tipo del gruppo cambia di conseguenza:
// - type "create": nessun membro è già in un aggregato → suggerisce di
//   crearne uno nuovo. label = parola significativa più comune (fallback:
//   nome più corto).
// - type "join": i membri già aggregati appartengono TUTTI a un unico
//   aggregato esistente, e c'è almeno un membro ancora libero → suggerisce
//   di aggiungere i membri liberi (newMembers) a quell'aggregato (aggregate).
//   label = nome dell'aggregato.
// - gruppo omesso del tutto se: i membri già aggregati appartengono a due
//   o più aggregati diversi (ambiguo, non proponiamo un merge), oppure se
//   sono già tutti dentro lo stesso aggregato (niente da suggerire).
// ignoredPairs: array di [ingIdA, ingIdB] (ordine qualsiasi) da escludere.
export const findSimilarIngredients = (ingredientDict, aggregates = [], ignoredPairs = []) => {
  const ids = Object.keys(ingredientDict || {});
  const isIgnored = (a, b) => (ignoredPairs || []).some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const sameAggregate = (a, b) => (aggregates || []).some(agg => (agg.members || []).includes(a) && (agg.members || []).includes(b));

  const edges = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      if (isIgnored(a, b) || sameAggregate(a, b)) continue;
      if (namesAreSimilar(ingredientDict[a], ingredientDict[b])) edges.push([a, b]);
    }
  }
  if (edges.length === 0) return [];

  // Union-find per raggruppare le coppie simili in cluster transitivi.
  const parent = new Map();
  const find = (x) => {
    if (!parent.has(x)) parent.set(x, x);
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r);
    parent.set(x, r);
    return r;
  };
  const union = (x, y) => { const rx = find(x), ry = find(y); if (rx !== ry) parent.set(rx, ry); };
  edges.forEach(([a, b]) => union(a, b));

  const clusters = new Map(); // radice → { members:Set, pairs:[] }
  edges.forEach(([a, b]) => {
    const root = find(a);
    if (!clusters.has(root)) clusters.set(root, { members: new Set(), pairs: [] });
    const c = clusters.get(root);
    c.members.add(a); c.members.add(b);
    c.pairs.push([a, b]);
  });

  const aggregateOf = (id) => (aggregates || []).find(agg => (agg.members || []).includes(id));

  return Array.from(clusters.values()).map(({ members, pairs }) => {
    const memberIds = Array.from(members);
    const key = memberIds.slice().sort().join("+");
    const touchedAggs = new Map(); // aggId → agg, tra quelli toccati dai membri del cluster
    memberIds.forEach(id => { const agg = aggregateOf(id); if (agg) touchedAggs.set(agg.id, agg); });

    if (touchedAggs.size >= 2) return null; // due aggregati diversi coinvolti: ambiguo, non proponiamo nulla
    if (touchedAggs.size === 1) {
      const agg = Array.from(touchedAggs.values())[0];
      const newMembers = memberIds.filter(id => !(agg.members || []).includes(id));
      if (newMembers.length === 0) return null; // già tutti dentro: niente da suggerire
      return { key, type: "join", label: agg.name, members: memberIds, newMembers, aggregate: agg, pairs };
    }

    // Nessun membro già aggregato: suggerisce un aggregato nuovo.
    const wordCounts = new Map();
    memberIds.forEach(id => significantWords(ingredientDict[id]).forEach(w => wordCounts.set(w, (wordCounts.get(w) || 0) + 1)));
    let label = memberIds.map(id => ingredientDict[id]).sort((a, b) => a.length - b.length)[0] || "";
    let bestCount = 0;
    wordCounts.forEach((count, w) => { if (count > bestCount) { bestCount = count; label = w; } });
    return { key, type: "create", label: label.charAt(0).toUpperCase() + label.slice(1), members: memberIds, pairs };
  }).filter(Boolean).sort((a, b) => b.members.length - a.members.length);
};

// ══════════════════════════════════════════════════════════════
// Suggerimenti allergie/intolleranze — stessa euristica di nome-simile di
// findSimilarIngredients sopra, ma un solo caso: "questo ingrediente non
// ancora classificato somiglia a un membro di un'allergia già definita".
//
// Differenza voluta rispetto agli aggregati: NON esiste un caso "create"
// (non ha senso suggerire di creare un'allergia dalla sola somiglianza di
// nome — è una scelta sempre iniziata dall'utente), e NON si scarta come
// "ambiguo" un ingrediente simile a membri di 2+ gruppi diversi: un
// aggregato è un'unica classe di equivalenza, un'allergia no — lo stesso
// ingrediente può avere più allergie/intolleranze insieme. Ogni coppia
// (ingrediente, gruppo) simile produce un suggerimento a sé.
//
// allergenGroups: [{id, label, members:[ingId,...], ...}]
// ignoredPairs: [[ingId, groupId], ...] — ORDINATE (ingrediente poi
// gruppo), non simmetriche come le coppie di findSimilarIngredients.
export const findAllergenSuggestions = (ingredientDict, allergenGroups = [], ignoredPairs = [], aggregates = []) => {
  const isIgnored = (ingId, groupId) => (ignoredPairs || []).some(([i, g]) => i === ingId && g === groupId);
  const suggestions = [];
  Object.keys(ingredientDict || {}).forEach(ingId => {
    (allergenGroups || []).forEach(group => {
      const expanded = expandAllergenMembers(group.members, aggregates);
      if (expanded.has(ingId)) return; // già membro (diretto o via aggregato) di questo gruppo
      if (isIgnored(ingId, group.id)) return;
      const similar = [...expanded].some(memberId =>
        ingredientDict[memberId] && namesAreSimilar(ingredientDict[ingId], ingredientDict[memberId])
      );
      if (similar) suggestions.push({ ingredientId: ingId, groupId: group.id, groupLabel: group.label });
    });
  });
  return suggestions;
};

// Un membro di un'allergia/intolleranza può essere un id ingrediente
// diretto o un id aggregato (collegamento "vivo": vedi punto 1 del piano
// allergie) — i due spazi di id non collidono mai per costruzione (vedi
// commento in cima al file su agg.id/uid("agg")). Risolve members
// nell'insieme REALE di ingredienti esclusi in questo momento, seguendo
// la composizione attuale di ogni aggregato referenziato (se un aggregato
// cambia membri più tardi, l'allergia lo segue automaticamente perché
// questa funzione viene richiamata ad ogni render, mai una copia salvata).
export const expandAllergenMembers = (members, aggregates = []) => {
  const aggById = new Map((aggregates || []).map(a => [a.id, a]));
  const out = new Set();
  (members || []).forEach(id => {
    const agg = aggById.get(id);
    if (agg) (agg.members || []).forEach(m => out.add(m));
    else out.add(id);
  });
  return out;
};
