// ══════════════════════════════════════════════════════════════
// Funzioni pure di calcolo e formattazione, estratte da ricettario-v23.jsx
// Nessuna di queste usa React o JSX.
// ══════════════════════════════════════════════════════════════
import { effectiveEquivalenceKey } from "./aggregates.js";

// Rifiuta una promise che resta pendente oltre `ms` — usata sui percorsi
// di bootstrap (login, caricamento libri) perché una chiamata di rete mai
// risolta non deve mai tradursi in un caricamento eterno per l'utente.
export const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

// "Altro" resta sempre in fondo, anche dopo l'aggiunta di nuove sezioni
export const sortSectionsAltroLast = (list) => [
  ...list.filter(s => s.id !== "altro"),
  ...list.filter(s => s.id === "altro"),
];

// "Ingredienti base" resta sempre in cima; per il resto (Altro compreso,
// è una categoria come le altre) l'ordine della lista non viene alterato.
export const sortCategoriesBaseFirst = (list) => [
  ...list.filter(c => c.id === "base"),
  ...list.filter(c => c.id !== "base"),
];

// ── Subsection data helpers ────────────────────────────────────
// ingredients and steps can be either:
//   flat:  ["item1", "item2", ...]
//   sectioned: [{ section:"Nome", items:["item1","item2"] }, ...]
//
// Steps items can be strings or {text, photo}

export const isSectioned = (arr) =>
  Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object" && "section" in arr[0];

// Normalize to sectioned format for editing
export const toSectioned = (arr) => {
  if (!arr || arr.length === 0) return [{ section:"", items:[] }];
  if (isSectioned(arr)) return arr;
  return [{ section:"", items: arr }];
};

// Flatten back to simple array if only one unnamed section
export const fromSectioned = (sections) => {
  if (sections.length === 1 && sections[0].section === "") return sections[0].items;
  return sections;
};

// ── Foto dei passaggi (step) ──────────────────────────────────────
// Un passo può avere più foto (fino a MAX_STEP_PHOTOS), salvate come
// dataURL in step.photos. Compatibilità con dati precedenti: un vecchio
// step.photo singolo viene promosso a lista; i valori finti usati prima
// che il caricamento reale esistesse ("PHOTO_PLACEHOLDER"/"PLACEHOLDER")
// non sono foto vere e vengono sempre scartati, ovunque.
export const MAX_STEP_PHOTOS = 4;
const FAKE_STEP_PHOTOS = new Set(["PHOTO_PLACEHOLDER", "PLACEHOLDER"]);
const isRealStepPhoto = (p) => typeof p === "string" && p.length > 0 && !FAKE_STEP_PHOTOS.has(p);
// Normalizza le foto di uno step (stringa, {photo} legacy o {photos}) in un
// array pulito di foto vere, qualunque sia il formato di provenienza.
export const stepPhotosOf = (step) => {
  if (!step || typeof step === "string") return [];
  if (Array.isArray(step.photos)) return step.photos.filter(isRealStepPhoto).slice(0, MAX_STEP_PHOTOS);
  if (step.photo != null) return isRealStepPhoto(step.photo) ? [step.photo] : [];
  return [];
};

// Durata in minuti di uno step (Modalità Cucina) — null per gli step senza,
// stesso identico pattern di stepPhotosOf. Una stringa semplice non ha mai
// una durata: solo la forma oggetto può portarla.
export const durationOf = (step) => {
  if (!step || typeof step === "string") return null;
  return typeof step.duration === "number" ? step.duration : null;
};

// Un passo senza foto NÉ durata torna stringa semplice (formato legacy); un
// passo con almeno una foto o una durata resta oggetto {text, photos?,
// duration?} (chiavi vuote omesse). Va applicato agli ITEM dentro ciascuna
// sottosezione, mai al wrapper {section, items} — vedi
// isSectioned/toSectioned/fromSectioned qui sopra.
export const stripPhotolessStep = (s) => {
  if (typeof s === "string") return s;
  const photos = stepPhotosOf(s);
  const duration = durationOf(s);
  if (photos.length === 0 && duration == null) return s?.text ?? "";
  const out = { text: s?.text ?? "" };
  if (photos.length > 0) out.photos = photos;
  if (duration != null) out.duration = duration;
  return out;
};

// Sposta uno o più item (step o ingredienti — la forma {section,items} è
// identica per entrambi, questa funzione non guarda mai il contenuto degli
// item) da una o più sezioni sorgente a un'unica destinazione, preservando
// l'ordine relativo ORIGINALE (visuale), non l'ordine di selezione — punto
// critico per il caso reale "ho scritto 8 passaggi, i primi 4 sono
// l'impasto": selezionare fuori ordine non deve alterare il risultato.
//
// positions: [{sectionIndex, itemIndex}, ...] — identificazione posizionale,
// mai per contenuto testuale (il testo può ripetersi in più punti).
// destination: {type:"existing", sectionIndex} | {type:"new", name}
// ("new" con name:"" crea un nuovo gruppo sciolto, se non ne esiste già uno).
//
// La sezione sorgente svuotata da uno spostamento RESTA nell'array come
// sezione vuota — ripulirla è responsabilità della normalizzazione a
// salvataggio (normalizeIngredients/normalizeSteps), non di questa funzione.
export const moveItemsBetweenSections = (sections, positions, destination) => {
  const sorted = [...positions].sort((a, b) =>
    a.sectionIndex - b.sectionIndex || a.itemIndex - b.itemIndex
  );
  const movedItems = sorted.map(({ sectionIndex, itemIndex }) => sections[sectionIndex].items[itemIndex]);

  // Rimozione per indice via filter+Set (mai splice sequenziali/ordine
  // decrescente: filter valuta l'array originale una sola volta, zero
  // problemi di shift anche con più rimozioni nella stessa sezione).
  const excludeBySection = new Map();
  sorted.forEach(({ sectionIndex, itemIndex }) => {
    if (!excludeBySection.has(sectionIndex)) excludeBySection.set(sectionIndex, new Set());
    excludeBySection.get(sectionIndex).add(itemIndex);
  });
  let next = sections.map((sec, si) => {
    const exclude = excludeBySection.get(si);
    if (!exclude) return sec;
    return { ...sec, items: sec.items.filter((_, ii) => !exclude.has(ii)) };
  });

  let targetIndex;
  if (destination.type === "new") {
    next = [...next, { section: destination.name.trim(), items: [] }];
    targetIndex = next.length - 1;
  } else {
    targetIndex = destination.sectionIndex;
  }

  return next.map((sec, si) => si !== targetIndex ? sec : { ...sec, items: [...sec.items, ...movedItems] });
};

// Normalizza gli step a salvataggio: ripulisce le foto/durata assenti
// (stripPhotolessStep) e scarta step a testo vuoto; sectioned-aware, come
// normalizeIngredients — scarta anche le sezioni rimaste vuote SENZA nome
// (una sezione vuota ma con nome resta, l'utente potrebbe starla ancora
// riempiendo o aver solo momentaneamente svuotato tutti i suoi step).
// Unica fonte di verità: prima duplicata (con piccola asimmetria) tra
// saveNewRecipe e EditScreen.jsx, che non filtrava affatto gli step vuoti.
export const normalizeSteps = (steps) =>
  isSectioned(steps)
    ? steps
        .map(sec => ({ ...sec, items: sec.items.map(stripPhotolessStep).filter(s => s.trim ? s.trim() : s) }))
        .filter(sec => sec.items.length > 0 || sec.section)
    : (steps || []).map(stripPhotolessStep).filter(s => s.trim ? s.trim() : s);

// Foto principale (dishPhoto) di una ricetta: stessa logica di scarto dei
// placeholder finti usata per le foto degli step, ma per un valore singolo.
export const dishPhotoOf = (recipe) => isRealStepPhoto(recipe?.dishPhoto) ? recipe.dishPhoto : null;

// Legge un file immagine e restituisce la dataURL via callback — stesso
// meccanismo già usato per le foto dei Ricordi (FileReader.readAsDataURL).
export const readImageFile = (file, onLoaded) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => onLoaded(ev.target.result);
  reader.readAsDataURL(file);
};

// Nome normalizzato per confronti esatti (frigo, aggregati, suggerimenti)
export const normName = (name) => (name || "").trim().toLowerCase();
// R9 — id univoci robusti (evita collisioni tra copie create nello stesso istante)
export const uid = (prefix = "") => {
  const rnd = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return prefix + Date.now().toString(36) + rnd;
};

// Numero → testo italiano compatto (250 · 0,5 · 7,25)
export const fmtQty = (n) => String(Math.round(n * 100) / 100).replace(".", ",");

// Unica funzione di visualizzazione, usata ovunque serva testo
export const ingredientToText = (ing) => {
  if (!ing || typeof ing === "string") return ing || "";
  const parts = [];
  if (ing.qty != null) parts.push(fmtQty(ing.qty));
  if (ing.unit) parts.push(ing.unit);
  const tail = parts.join(" ");
  const note = ing.note ? ` (${ing.note})` : "";
  return tail ? `${ing.name}: ${tail}${note}` : `${ing.name}${note}`;
};

// Scala la quantità (le unità restano invariate)
export const scaleIngredient = (ing, factor) =>
  ing.qty != null ? { ...ing, qty: Math.round(ing.qty * factor * 100) / 100 } : ing;

// Appiattisce ingredienti (anche sezionati) → [{...ing, section}]
export const flattenIngredients = (ingredients) => {
  if (!Array.isArray(ingredients)) return [];
  if (ingredients.length > 0 && typeof ingredients[0] === "object" && "section" in ingredients[0]) {
    return ingredients.flatMap(s => (s.items || []).map(it => ({ ...it, section: s.section })));
  }
  return ingredients.map(it => ({ ...it, section: null }));
};

// Tutti gli ingredienti unici del ricettario → [{ name (normalizzato), display }]
export const collectAllIngredients = (recipes) => {
  const map = new Map();
  recipes.forEach(r => {
    flattenIngredients(r.ingredients).forEach(ing => {
      const key = normName(ing.name);
      if (key && !map.has(key)) map.set(key, ing.name.trim());
    });
  });
  return Array.from(map.entries())
    .map(([name, display]) => ({ name, display }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
};

// ══════════════════════════════════════════════════════════════
// R2 — DIZIONARIO INGREDIENTI: id stabile → nome visualizzato
// Le relazioni (categorie, nutrizione, equivalenze, membri aggregati)
// sono keyed per ID: rinominare un ingrediente non le rompe più.
// Migrazione trasparente: per i dati esistenti l'id coincide col nome
// normalizzato, quindi le mappe demo/salvate restano valide.
// ══════════════════════════════════════════════════════════════
export const buildIngredientDict = (recipes, existing = {}) => {
  const dict = { ...existing };
  const taken = new Set(Object.keys(dict));
  const byName = new Map(Object.entries(dict).map(([id, nm]) => [normName(nm), id]));
  // Riferimento stabile a zero modifiche: senza, ogni modifica a una
  // ricetta produrrebbe un nuovo oggetto anche quando il dizionario non
  // cambia davvero, facendo scattare inutilmente il salvataggio del
  // documento system (vedi l'effetto dedicato in ricettario-v23.jsx).
  let added = false;
  collectAllIngredients(recipes).forEach(({ display }) => {
    const key = normName(display);
    if (byName.has(key)) return;
    let id = key, n = 2;
    while (taken.has(id)) id = key + "_" + (n++);
    dict[id] = display; taken.add(id); byName.set(key, id);
    added = true;
  });
  return added ? dict : existing;
};
// Indice inverso (nome normalizzato → id); costruirlo una volta e riusarlo
export const ingDictIndex = (dict = {}) => {
  const m = new Map();
  Object.entries(dict).forEach(([id, nm]) => { if (!m.has(normName(nm))) m.set(normName(nm), id); });
  return m;
};
// Risolve il nome scritto in ricetta nell'id; fallback = normName (nome nuovo)
export const resolveIngId = (idx, name) => (idx && idx.get(normName(name))) || normName(name);
// Applica una trasformazione a ogni ingrediente preservando le sottosezioni
export const mapIngredientsStruct = (ingredients, fn) => {
  if (!Array.isArray(ingredients)) return ingredients;
  if (ingredients.length > 0 && typeof ingredients[0] === "object" && "section" in ingredients[0]) {
    return ingredients.map(s => ({ ...s, items: (s.items || []).map(fn) }));
  }
  return ingredients.map(fn);
};

// ── Numerazione gerarchica dei passaggi ───────────────────────────
// Regola: i passaggi SCIOLTI (in gruppi senza nome, "section:"") hanno
// un numero semplice, continuo su tutta la ricetta (1,2,3…) — un'intera
// sequenza di passaggi sciolti consecutivi conta come UN solo blocco.
// Ogni sottosezione con nome è invece un blocco a sé: i suoi passaggi
// condividono un solo numero di primo livello (la posizione del blocco
// nella sequenza generale — dove un'intera sequenza sciolta vale una
// posizione) e ricevono "N.M" (M = posizione dentro la sottosezione).
// Senza sottosezioni: numerazione semplice 1,2,3… identica a prima. Un
// solo posto per il calcolo, così StepsView e CookingMode mostrano
// sempre lo stesso numero per lo stesso passaggio — l'ordine restituito
// è lo stesso di flattenSteps.
export const stepNumbers = (steps) => {
  if (!isSectioned(steps)) {
    return (steps || []).map((_, i) => ({ sectionIndex: i + 1, indexInSection: null }));
  }
  let blockCounter = 0;  // posizione del blocco corrente (sottosezione, o intera sequenza sciolta)
  let looseCounter = 0;  // numero semplice, continuo, dei passaggi sciolti
  let inLooseRun = false;
  const out = [];
  steps.forEach(sec => {
    const named = !!sec.section;
    if (named) {
      blockCounter++;
      inLooseRun = false;
      const sectionTop = blockCounter;
      (sec.items || []).forEach((_, i) => {
        out.push({ sectionIndex: sectionTop, indexInSection: i + 1 });
      });
    } else {
      if (!inLooseRun) { blockCounter++; inLooseRun = true; }
      (sec.items || []).forEach(() => {
        out.push({ sectionIndex: ++looseCounter, indexInSection: null });
      });
    }
  });
  return out;
};

// Formatta l'etichetta numerica di un passaggio: "N.M" se dentro una
// sottosezione, altrimenti solo "N".
export const stepNumberLabel = (sectionIndex, indexInSection) =>
  indexInSection != null ? `${sectionIndex}.${indexInSection}` : `${sectionIndex}`;

export const flattenSteps = (steps) => {
  if (!Array.isArray(steps)) return [];
  const numbers = stepNumbers(steps);
  let n = 0;
  if (steps.length > 0 && typeof steps[0] === "object" && "section" in steps[0]) {
    return steps.flatMap(s => s.items.map(it => {
      const photos = stepPhotosOf(it);
      const { sectionIndex, indexInSection } = numbers[n++];
      return {
        text: typeof it === "string" ? it : it.text,
        photo: photos[0] ?? null, // compat: primo dei consumatori che leggono ancora photo singolo
        photos,
        duration: durationOf(it),
        section: s.section,
        sectionIndex,
        indexInSection,
      };
    }));
  }
  return steps.map(it => {
    const photos = stepPhotosOf(it);
    const { sectionIndex, indexInSection } = numbers[n++];
    return {
      text: typeof it === "string" ? it : it.text,
      photo: photos[0] ?? null,
      photos,
      duration: durationOf(it),
      section: null,
      sectionIndex,
      indexInSection,
    };
  });
};

// Estrae il primo numero (con eventuale unità) da un testo ingrediente
// Unità riconosciute (plurali normalizzati al singolare)
export const UNIT_ALIASES = {
  g:"g", gr:"g", grammi:"g", grammo:"g", kg:"kg", ml:"ml", l:"l", cl:"cl", dl:"dl",
  cucchiaio:"cucchiaio", cucchiai:"cucchiaio",
  cucchiaino:"cucchiaino", cucchiaini:"cucchiaino",
  tazza:"tazza", tazze:"tazza",
  bicchiere:"bicchiere", bicchieri:"bicchiere",
  bustina:"bustina", bustine:"bustina",
  pizzico:"pizzico", pizzichi:"pizzico",
  spicchio:"spicchio", spicchi:"spicchio",
};
export const unitLabel = (u) => u === "" ? "unità" : u;
// R4 — normalizzatore di unità unico (prima duplicato come nu/normUnit in più punti)
export const normUnit = (u) => UNIT_ALIASES[(u || "").toLowerCase()] || (u || "").toLowerCase();
// R4 — riga macro compatta. opts.salt aggiunge il sale, opts.per100 aggiunge "/100g",
// opts.fib=false omette la fibra (usato dove prima esisteva macroLine2).
export const macroLine = (v, opts = {}) => {
  const c = (x) => String(x).replace(".", ",");
  let out = `${v.kcal} kcal · C ${c(v.carb)} · P ${c(v.prot)} · Gr ${c(v.fat)}`;
  if (opts.fib !== false && v.fib != null) out += ` · Fib ${c(v.fib)}`;
  if (opts.salt && v.salt != null) out += ` · sale ${c(v.salt)} g`;
  if (opts.per100) out += " /100g";
  return out;
};

// ── Conversione quantità → grammi ──
// Unità dirette (g/kg/ml…, fisse) oppure il fattore dell'equivalenza
// specifica dell'ingrediente (sempre "1 unità = X g", i grammi sono l'hub
// unico). ml→g approssimato 1:1 (ragionevole per liquidi acquosi).
// null = non convertibile (serve definire l'equivalenza).
export const WEIGHT_UNITS = { g:1, kg:1000, ml:1, l:1000, cl:10, dl:100 };

// Grammi per 1 unità di una voce specifica (ingrediente/aggregato), secondo
// la priorità: unità fisse (sempre certe) > equivalenza specifica della voce
// (factors, vince sempre se presente) > conversione di sistema personalizzata
// (customUnits: default globale valido finché nessuno lo sovrascrive qui).
// null = non convertibile. Unica definizione condivisa da ingredientToGrams,
// ShoppingListScreen e OrganizeIngredientsScreen: evita che le tre viste
// possano disallinearsi sull'ordine di priorità.
export const gramsPerUnitFor = (unit, factors = {}, customUnits = {}) => {
  if (unit in WEIGHT_UNITS) return WEIGHT_UNITS[unit];
  if (factors[unit] > 0) return factors[unit];
  const cu = customUnits[unit];
  return cu?.grams > 0 ? cu.grams : null;
};

export const ingredientToGrams = (ing, equivalences = {}, dictIdx = null, aggregates = [], sourceByIngredient, customUnits = {}) => {
  if (ing.qty == null) return null;
  const unit = normUnit(ing.unit);
  // Se l'ingrediente appartiene a un aggregato con equivalenze proprie,
  // quelle vincono (stessa priorità già applicata per la nutrizione).
  const ingKey = resolveIngId(dictIdx, ing.name);
  const effKey = effectiveEquivalenceKey(ingKey, aggregates, equivalences, sourceByIngredient);
  const factors = equivalences[effKey]?.factors || {};
  const g = gramsPerUnitFor(unit, factors, customUnits);
  return g != null ? ing.qty * g : null;
};

export const parseIngredientAmount = (text) => {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*([a-zàèéìòù]+)?/i);
  if (!m) return null;
  const raw = (m[2] || "").toLowerCase();
  const unit = UNIT_ALIASES[raw] || "";
  return { amount: parseFloat(m[1].replace(",", ".")), unit };
};

// ── Scomposizione/ricomposizione ingrediente "Nome: quantità unità" ──
// La memorizzazione resta la stringa (compatibile con tutto il resto dell'app);
// il form la presenta come tre campi separati.
export const decomposeIngredient = (text) => {
  const idx = text.indexOf(":");
  if (idx < 0) return { name: text, qty: "", unit: "" };
  const name = text.slice(0, idx);
  const rest = text.slice(idx + 1).trim();
  const m = rest.match(/^(\d+(?:[.,]\d*)?)\s*(.*)$/);
  if (!m) return { name, qty: "", unit: rest }; // es. "q.b."
  return { name, qty: m[1], unit: m[2] || "" };
};
export const composeIngredient = (name, qty, unit) => {
  const q = qty.trim(), u = unit.trim();
  const tail = [q, u].filter(Boolean).join(" ");
  return tail ? `${name}: ${tail}` : name;
};

// ── Durata di uno step (Modalità Cucina) — rilevamento da testo libero ──
// Stesso stile di parseIngredientAmount: piccole regex mirate + tabella di
// alias, mai un'eccezione — null quando non si riconosce nulla, così chi
// chiama tratta "nessun timer rilevato" come caso normale, non un errore.
const DURATION_UNIT_ALIASES = {
  min:"min", minuto:"min", minuti:"min",
  h:"h", ora:"h", ore:"h",
};
// Frazioni d'ora usate in "un'ora e mezza/un quarto/tre quarti"
const HOUR_FRACTIONS = { "mezza":30, "mezzo":30, "un quarto":15, "tre quarti":45 };
const toMinutes = (amount, unit) => DURATION_UNIT_ALIASES[unit] === "h" ? amount * 60 : amount;

// Ritorna i minuti individuati nel testo di uno step, o null se non ne
// riconosce nessuno — è un suggerimento (vedi EditSectionedSteps.jsx), mai
// un'imposizione. Negli intervalli ("20-25 minuti") propone il valore più
// piccolo, come da richiesta esplicita.
export const parseStepDuration = (text) => {
  if (!text) return null;
  // Normalizza le forme parlate più comuni prima dei pattern numerici,
  // così "un'ora e mezza" diventa "1 ora e mezza" e riusa lo stesso pattern
  // di "2 ore e mezza"; "mezz'ora" da sola diventa "30 min" e riusa il
  // pattern semplice più sotto.
  const t = text.toLowerCase()
    .replace(/\bun'?\s*ora\b/g, "1 ora")
    .replace(/\bmezz'?\s*ora\b/g, "30 min");

  // "1h 30", "1h30", "1 h 30" — ore e minuti insieme
  let m = t.match(/(\d+)\s*h\s*(\d{1,2})?\b/);
  if (m) return parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0);

  // "1 ora e mezza/un quarto/tre quarti" (dopo la normalizzazione sopra)
  m = t.match(/(\d+(?:[.,]\d+)?)\s*(or[ae]|h)\s+e\s+(mezz[ao]|un quarto|tre quarti)/);
  if (m) return parseFloat(m[1].replace(",", ".")) * 60 + (HOUR_FRACTIONS[m[3]] || 0);

  // Intervallo "20-25 minuti" / "20 - 25 min" — il valore più piccolo
  m = t.match(/(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s*(minuti|minuto|min|or[ae]|h)\b/);
  if (m) {
    const a = parseFloat(m[1].replace(",", "."));
    const b = parseFloat(m[2].replace(",", "."));
    return Math.round(toMinutes(Math.min(a, b), DURATION_UNIT_ALIASES[m[3]]));
  }

  // Caso semplice "N minuti/min/ore/ora/h"
  m = t.match(/(\d+(?:[.,]\d+)?)\s*(minuti|minuto|min|or[ae]|h)\b/);
  if (m) return Math.round(toMinutes(parseFloat(m[1].replace(",", ".")), DURATION_UNIT_ALIASES[m[2]]));

  return null;
};

// Etichetta periodo da una data ISO (stagione + anno) per le intestazioni del diario
export const memoryPeriodLabel = (dateISO) => {
  if (!dateISO) return "Data sconosciuta";
  const d = new Date(dateISO);
  if (isNaN(d)) return "Data sconosciuta";
  const m = d.getMonth();
  const y = d.getFullYear();
  const season = m <= 1 || m === 11 ? "Inverno" : m <= 4 ? "Primavera" : m <= 7 ? "Estate" : "Autunno";
  // L'inverno di dicembre appartiene "all'anno successivo" nel linguaggio comune, ma teniamolo semplice: stagione + anno
  return `${season} ${y}`;
};
// Ordinamento cronologico (dal più recente): usa dateISO se c'è, altrimenti prova a interpretare date
export const memorySortKey = (mem) => {
  if (mem.dateISO) return mem.dateISO;
  return "0000-00-00";
};

// ── HELPER: risolve la "vista aggregata" degli ingredienti ──
// Restituisce le "voci selezionabili": aggregati + ingredienti singoli
// non appartenenti a nessun aggregato. Ogni voce porta con sé i "membri"
// (nomi puliti reali usati nelle ricette) e le categorie.
// members = ID del dizionario (non nomi): sopravvivono alle rinomine.
export const buildFridgeItems = (recipes, aggregates, ingredientCategories, ingredientDict = null) => {
  const dictIdx = ingredientDict ? ingDictIndex(ingredientDict) : null;
  const allIngs = collectAllIngredients(recipes); // [{name (norm), display}]
  const memberToAgg = new Map();
  aggregates.forEach(agg => (agg.members || []).forEach(m => {
    if (!memberToAgg.has(m)) memberToAgg.set(m, []);
    memberToAgg.get(m).push(agg.id);
  }));

  const items = [];

  // 1) Un elemento per aggregato
  aggregates.forEach(agg => {
    const catSet = new Set(agg.categories || []);
    (agg.members || []).forEach(m => (ingredientCategories[m] || []).forEach(c => catSet.add(c)));
    items.push({
      key: "agg_" + agg.id,
      display: agg.name,
      isAggregate: true,
      members: agg.members || [], // id
      categories: Array.from(catSet), // può essere vuoto: nessuna categoria assegnata
      // true se non ha nessuna categoria propria: raggruppato a parte in
      // "Senza categoria", distinto da un ingrediente a cui "Altro" è stato
      // assegnato volutamente (che è una categoria come le altre).
      uncategorized: catSet.size === 0,
    });
  });

  // 2) Ingredienti singoli non aggregati
  allIngs.forEach(({ name, display }) => {
    const ingId = resolveIngId(dictIdx, name);
    if (memberToAgg.has(ingId)) return; // già dentro un aggregato
    const shown = (ingredientDict && ingredientDict[ingId]) || display;
    const cats = ingredientCategories[ingId];
    items.push({
      key: "ing_" + ingId,
      display: shown.charAt(0).toUpperCase() + shown.slice(1),
      isAggregate: false,
      members: [ingId],
      categories: cats && cats.length ? cats : [],
      uncategorized: !(cats && cats.length),
    });
  });

  return items;
};
