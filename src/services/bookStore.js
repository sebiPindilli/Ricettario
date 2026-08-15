// Fase 1 — funzioni di lettura/scrittura Firestore per un libro.
// Rispecchiano la struttura concordata:
//   books/{bookId}                    → campo meta:{name,type,owner,bookTheme,memberEmails,memberRoles}
//   books/{bookId}/system/data        → documento singolo con i campi "piccoli"
//   books/{bookId}/shoppingList/data  → documento singolo {entries:[...]}
//   books/{bookId}/recipes/{recipeId} → sotto-collezione (vedi Fase 1.2)
import { db } from "../firebase.js";
import {
  doc, setDoc, deleteDoc, collection,
  query, where,
} from "firebase/firestore";
import { MACRO_SECTIONS, INGREDIENT_CATEGORIES } from "../data/constants.js";
import { uploadPhoto, dishPhotoPath, stepPhotoPath, memoryPhotoPath } from "./photoStore.js";
import { getDocOfflineFirst, getDocsOfflineFirst } from "./offlineFirst.js";

// Le funzioni /api/* rispondono sempre in JSON quando servite da Vercel
// (produzione o `vercel dev`) — ma il semplice `npm run dev` (Vite puro,
// porta 5173) non serve affatto le funzioni serverless: in quel caso
// res.json() fallisce con un errore criptico ("unexpected end of json
// input"). Qui lo trasformiamo in un messaggio comprensibile.
const parseApiResponse = async (res) => {
  try {
    return await res.json();
  } catch {
    throw new Error("Impossibile contattare il server. In locale serve `vercel dev` (non il solo `npm run dev`).");
  }
};

const bookRef = (bookId) => doc(db, "books", bookId);
const systemRef = (bookId) => doc(db, "books", bookId, "system", "data");
const shoppingListRef = (bookId) => doc(db, "books", bookId, "shoppingList", "data");
const recipesCol = (bookId) => collection(db, "books", bookId, "recipes");
const recipeRef = (bookId, recipeId) => doc(db, "books", bookId, "recipes", String(recipeId));

// Stato iniziale del documento "system" per un libro nuovo — equivalente
// a emptyBookData() in ricettario-v23.jsx, meno recipes e shoppingList
// (che hanno la loro collocazione dedicata).
export const emptySystemData = () => ({
  extraTagGroups: [],
  sectionList: MACRO_SECTIONS,
  categoryList: INGREDIENT_CATEGORIES,
  ingredientCategories: {},
  aggregates: [],
  equivalences: {},
  customUnits: {},
  nutritionMap: {},
  customFoods: [],
  ingredientDict: {},
  sourceByIngredient: {},
  ignoredSimilarities: [],
});

export const saveBookMeta = (bookId, meta) =>
  setDoc(bookRef(bookId), { meta }, { merge: true });

export const loadBookMeta = async (bookId) => {
  const snap = await getDocOfflineFirst(bookRef(bookId));
  return snap.exists() ? (snap.data().meta || null) : null;
};

// Firestore rifiuta le chiavi di mappa vuote (""). L'app usa "" come
// chiave in equivalences[nome].factors per indicare l'unità "implicita"
// (es. "1 uovo" ≈ 60g, nessuna unità scritta) — va codificata prima di
// salvare e decodificata dopo aver letto, così il resto dell'app non se
// ne accorge mai.
const EMPTY_UNIT_KEY = "senzaunita"; // niente "__" iniziale/finale: Firestore lo rifiuta (riservato)

const mapFactorKeys = (equivalences, fromKey, toKey) => {
  const out = {};
  for (const [name, eq] of Object.entries(equivalences || {})) {
    const factors = {};
    for (const [unit, grams] of Object.entries(eq?.factors || {})) {
      factors[unit === fromKey ? toKey : unit] = grams;
    }
    out[name] = { ...eq, factors };
  }
  return out;
};
// Esportate (non solo uso interno): sharedRecipesStore.js le riusa per lo
// stesso motivo alla condivisione di una ricetta via link — mai una
// seconda implementazione della stessa codifica.
export const encodeEquivalences = (eq) => mapFactorKeys(eq, "", EMPTY_UNIT_KEY);
export const decodeEquivalences = (eq) => mapFactorKeys(eq, EMPTY_UNIT_KEY, "");

// Firestore rifiuta gli array annidati: ignoredSimilarities è
// [[idA,idB], ...] in memoria — codificato come array di oggetti {a,b}
// prima di salvare, decodificato dopo aver letto (decode difensivo: accetta
// anche la forma non codificata, per non rompersi su dati seminati a mano).
const encodeIgnoredSimilarities = (pairs) => (pairs || []).map(([a, b]) => ({ a, b }));
const decodeIgnoredSimilarities = (pairs) => (pairs || []).map((p) => Array.isArray(p) ? p : [p.a, p.b]);

export const saveBookSystem = (bookId, system) =>
  setDoc(systemRef(bookId), {
    ...system,
    equivalences: encodeEquivalences(system.equivalences),
    ignoredSimilarities: encodeIgnoredSimilarities(system.ignoredSimilarities),
  });

export const loadBookSystem = async (bookId) => {
  const snap = await getDocOfflineFirst(systemRef(bookId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    equivalences: decodeEquivalences(data.equivalences),
    ignoredSimilarities: decodeIgnoredSimilarities(data.ignoredSimilarities),
  };
};

export const saveShoppingList = (bookId, entries) =>
  setDoc(shoppingListRef(bookId), { entries });

export const loadShoppingList = async (bookId) => {
  const snap = await getDocOfflineFirst(shoppingListRef(bookId));
  return snap.exists() ? (snap.data().entries || []) : [];
};

// Crea un libro nuovo — passa da /api/create-book (Admin SDK) invece di
// scrivere direttamente su Firestore: è l'unico modo per far rispettare
// davvero il limite di 10 libri di proprietà per utente (le regole non
// permettono create diretti sul client, vedi firestore.rules). Dopo la
// creazione, system/shoppingList vuoti si scrivono come prima dal client
// (l'utente è già owner secondo le nuove regole).
export const createBookInFirestore = async ({ idToken, name, type = "personale", bookTheme = "classic" }) => {
  const res = await fetch("/api/create-book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, name, type, bookTheme }),
  });
  const data = await parseApiResponse(res);
  if (!res.ok) throw new Error(data.error || "Creazione del ricettario non riuscita.");
  await saveBookSystem(data.id, emptySystemData());
  await saveShoppingList(data.id, []);
  return data.id;
};

// Elimina un libro — passa da /api/delete-book (Admin SDK): verifica
// proprietà, blocca libro personale/Beta, elimina ricorsivamente e
// decrementa il contatore in modo non aggirabile dal client.
export const deleteBookInFirestore = async ({ idToken, bookId }) => {
  const res = await fetch("/api/delete-book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, bookId }),
  });
  if (!res.ok) {
    const data = await parseApiResponse(res);
    throw new Error(data.error || "Eliminazione non riuscita.");
  }
};

// "I miei libri": quelli di cui sono owner + quelli di cui sono membro,
// più — se tester/admin — il Ricettario Beta (b1, accesso per ruolo,
// vedi firestore.rules), sempre incluso senza bisogno di essere membro.
export const listMyBooks = async (email, role) => {
  const [ownedSnap, memberSnap] = await Promise.all([
    getDocsOfflineFirst(query(collection(db, "books"), where("meta.owner", "==", email))),
    getDocsOfflineFirst(query(collection(db, "books"), where("meta.memberEmails", "array-contains", email))),
  ]);
  const byId = new Map();
  [...ownedSnap.docs, ...memberSnap.docs].forEach((d) => byId.set(d.id, { id: d.id, ...d.data().meta }));
  if (role === "admin" || role === "tester") {
    // Non fatale se non disponibile offline (es. mai aperto il Beta su
    // questo dispositivo): i libri propri restano comunque utilizzabili.
    try {
      const betaSnap = await getDocOfflineFirst(bookRef("b1"));
      if (betaSnap.exists()) byId.set("b1", { id: "b1", ...betaSnap.data().meta });
    } catch {
      // ignorato di proposito
    }
  }
  return Array.from(byId.values());
};

// Gestione membri — passa da /api/manage-book-member (Admin SDK) invece di
// updateDoc diretti: è l'unico punto che scrive meta.memberEmails/
// memberRoles (le regole bloccano quei campi dal client, vedi
// firestore.rules) e applica la matrice di permessi a 4 ruoli
// (src/utils/bookRoles.js, la stessa usata server-side e nelle regole).
const manageBookMember = async ({ idToken, bookId, action, targetEmail, newRole }) => {
  const res = await fetch("/api/manage-book-member", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, bookId, action, targetEmail, newRole }),
  });
  const data = await parseApiResponse(res);
  if (!res.ok) throw new Error(data.error || "Operazione sui membri non riuscita.");
};

export const addBookMember = ({ idToken, bookId, targetEmail, newRole }) =>
  manageBookMember({ idToken, bookId, action: "invite", targetEmail, newRole });

export const setBookMemberPermission = ({ idToken, bookId, targetEmail, newRole }) =>
  manageBookMember({ idToken, bookId, action: "changeRole", targetEmail, newRole });

export const removeBookMember = ({ idToken, bookId, targetEmail }) =>
  manageBookMember({ idToken, bookId, action: "remove", targetEmail });

// ── Sotto-collezione recipes: un documento per ricetta ──
// recipe.id (numero nella demo, stringa uid("r") altrove) diventa l'id
// documento come stringa — è solo un identificatore stabile, il tipo non
// conta per il resto dell'app.
const isBase64Photo = (v) => typeof v === "string" && v.startsWith("data:");
const isSectioned = (arr) => Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object" && "section" in arr[0];

// Carica una singola foto; se l'upload fallisce (tipicamente: offline —
// Storage non ha una coda offline come Firestore, vedi src/firebase.js)
// non propaga l'errore: mantiene la foto già sincronizzata in precedenza
// (previousValue) invece di bloccare il salvataggio dell'intera ricetta.
// La ricetta in memoria conserva comunque il nuovo base64 (non toccata
// qui), quindi resta "dirty" e il prossimo giro (o il retry alla
// riconnessione, vedi ricettario-v23.jsx) ritenta da sola l'upload.
const resolvePhoto = async (path, value, previousValue) => {
  if (!isBase64Photo(value)) return value;
  try {
    return await uploadPhoto(path, value);
  } catch (e) {
    console.warn("Upload foto non riuscito, mantengo quella precedente", e);
    return previousValue ?? null;
  }
};

// Indicizza gli step della versione precedente per posizione (stessa
// convenzione di stepKey sotto), per recuperare le foto già caricate a cui
// tornare in caso di fallimento upload.
const indexStepsByKey = (steps) => {
  const map = new Map();
  if (!Array.isArray(steps)) return map;
  if (isSectioned(steps)) {
    steps.forEach((sec, si) => (sec.items || []).forEach((st, ii) => map.set(`${si}_${ii}`, st)));
  } else {
    steps.forEach((st, i) => map.set(`${i}`, st));
  }
  return map;
};

// Carica le foto di un singolo step (se ne ha, in un array `photos`) e
// ritorna lo step con le stesse foto sostituite dalle download URL.
const uploadStepPhotos = async (bookId, recipeId, step, stepKey, previousStepsByKey) => {
  if (typeof step === "string" || !Array.isArray(step.photos)) return step;
  const prevPhotos = previousStepsByKey.get(`${stepKey}`)?.photos;
  const photos = await Promise.all(step.photos.map((p, j) =>
    resolvePhoto(stepPhotoPath(bookId, recipeId, stepKey, j), p, Array.isArray(prevPhotos) ? prevPhotos[j] : null)
  ));
  return { ...step, photos };
};

// steps può essere piatto ([step,...]) o sezionato ([{section,items},...])
// — stessa ambiguità già presente su ingredients (vedi mapIngredientsStruct
// in utils/helpers.js). stepKey resta univoco in entrambi i casi.
const uploadAllStepPhotos = async (bookId, recipeId, steps, previousSteps) => {
  if (!Array.isArray(steps)) return steps;
  const previousStepsByKey = indexStepsByKey(previousSteps);
  if (isSectioned(steps)) {
    return Promise.all(steps.map(async (sec, si) => ({
      ...sec,
      items: await Promise.all((sec.items || []).map((st, ii) => uploadStepPhotos(bookId, recipeId, st, `${si}_${ii}`, previousStepsByKey))),
    })));
  }
  return Promise.all(steps.map((st, i) => uploadStepPhotos(bookId, recipeId, st, i, previousStepsByKey)));
};

// I ricordi hanno una foto sola: può essere un'emoji (stringa breve,
// photoIsImage:false) o una foto vera (base64, photoIsImage:true).
// Solo il secondo caso va caricato su Storage. Abbinati per id (stabile
// anche se l'ordine cambia), non per posizione.
const uploadMemoryPhotos = async (bookId, recipeId, memories, previousMemories) => {
  if (!Array.isArray(memories)) return memories;
  const previousById = new Map((previousMemories || []).map((m) => [m.id, m]));
  return Promise.all(memories.map(async (mem) => {
    if (!mem.photoIsImage || !isBase64Photo(mem.photo)) return mem;
    const prev = previousById.get(mem.id);
    const photo = await resolvePhoto(memoryPhotoPath(bookId, recipeId, mem.id), mem.photo, prev?.photoIsImage ? prev.photo : null);
    return { ...mem, photo };
  }));
};

// Sostituisce ogni foto base64 della ricetta (piatto, step, ricordi) con
// la sua download URL su Storage — mai base64 dentro al documento
// Firestore. Le foto già caricate (URL) o assenti (null) restano intatte.
// `previous` (opzionale) è l'ultima versione della ricetta effettivamente
// sincronizzata: usata come fallback per le foto che non si riescono a
// caricare ora (vedi resolvePhoto).
const uploadRecipePhotos = async (bookId, recipe, previous) => {
  const out = { ...recipe };
  if (isBase64Photo(out.dishPhoto)) {
    out.dishPhoto = await resolvePhoto(dishPhotoPath(bookId, recipe.id), out.dishPhoto, previous?.dishPhoto);
  }
  out.steps = await uploadAllStepPhotos(bookId, recipe.id, out.steps, previous?.steps);
  out.memories = await uploadMemoryPhotos(bookId, recipe.id, out.memories, previous?.memories);
  return out;
};

export const saveRecipe = async (bookId, recipe, previous) => {
  const withUploadedPhotos = await uploadRecipePhotos(bookId, recipe, previous);
  return setDoc(recipeRef(bookId, withUploadedPhotos.id), withUploadedPhotos);
};

export const deleteRecipe = (bookId, recipeId) =>
  deleteDoc(recipeRef(bookId, recipeId));

export const loadAllRecipes = async (bookId) => {
  const snap = await getDocsOfflineFirst(recipesCol(bookId));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
};

// ── Checkpoint 1.3: round-trip completo di un libro ──
// I 12 campi del documento "system" (stesso ordine di emptySystemData).
const SYSTEM_FIELDS = [
  "extraTagGroups", "sectionList", "categoryList", "ingredientCategories",
  "aggregates", "equivalences", "customUnits", "nutritionMap",
  "customFoods", "ingredientDict", "sourceByIngredient", "ignoredSimilarities",
];

// data = { meta, recipes, shoppingList, ...i 12 campi system } — stessa
// forma restituita da loadFullBook, così save→load è un round-trip pulito.
export const saveFullBook = async (bookId, data) => {
  const system = {};
  SYSTEM_FIELDS.forEach((k) => { system[k] = data[k]; });
  await Promise.all([
    saveBookMeta(bookId, data.meta),
    saveBookSystem(bookId, system),
    saveShoppingList(bookId, data.shoppingList),
    ...data.recipes.map((r) => saveRecipe(bookId, r)),
  ]);
};

export const loadFullBook = async (bookId) => {
  const [meta, system, shoppingList, recipes] = await Promise.all([
    loadBookMeta(bookId),
    loadBookSystem(bookId),
    loadShoppingList(bookId),
    loadAllRecipes(bookId),
  ]);
  return { meta, recipes, shoppingList, ...system };
};
