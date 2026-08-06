// Fase 1 — funzioni di lettura/scrittura Firestore per un libro.
// Rispecchiano la struttura concordata:
//   books/{bookId}                    → campo meta:{name,type,owner,bookTheme,memberEmails,memberRoles}
//   books/{bookId}/system/data        → documento singolo con i campi "piccoli"
//   books/{bookId}/shoppingList/data  → documento singolo {entries:[...]}
//   books/{bookId}/recipes/{recipeId} → sotto-collezione (vedi Fase 1.2)
import { db } from "../firebase.js";
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection,
  query, where, arrayUnion, arrayRemove, deleteField,
} from "firebase/firestore";
import { MACRO_SECTIONS, INGREDIENT_CATEGORIES } from "../data/constants.js";
import { uploadPhoto, dishPhotoPath, stepPhotoPath, memoryPhotoPath } from "./photoStore.js";

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
  const snap = await getDoc(bookRef(bookId));
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
const encodeEquivalences = (eq) => mapFactorKeys(eq, "", EMPTY_UNIT_KEY);
const decodeEquivalences = (eq) => mapFactorKeys(eq, EMPTY_UNIT_KEY, "");

export const saveBookSystem = (bookId, system) =>
  setDoc(systemRef(bookId), { ...system, equivalences: encodeEquivalences(system.equivalences) });

export const loadBookSystem = async (bookId) => {
  const snap = await getDoc(systemRef(bookId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { ...data, equivalences: decodeEquivalences(data.equivalences) };
};

export const saveShoppingList = (bookId, entries) =>
  setDoc(shoppingListRef(bookId), { entries });

export const loadShoppingList = async (bookId) => {
  const snap = await getDoc(shoppingListRef(bookId));
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
    getDocs(query(collection(db, "books"), where("meta.owner", "==", email))),
    getDocs(query(collection(db, "books"), where("meta.memberEmails", "array-contains", email))),
  ]);
  const byId = new Map();
  [...ownedSnap.docs, ...memberSnap.docs].forEach((d) => byId.set(d.id, { id: d.id, ...d.data().meta }));
  if (role === "admin" || role === "tester") {
    const betaSnap = await getDoc(bookRef("b1"));
    if (betaSnap.exists()) byId.set("b1", { id: "b1", ...betaSnap.data().meta });
  }
  return Array.from(byId.values());
};

export const addBookMember = (bookId, email, permission) =>
  updateDoc(bookRef(bookId), {
    "meta.memberEmails": arrayUnion(email),
    [`meta.memberRoles.${email}`]: permission,
  });

export const setBookMemberPermission = (bookId, email, permission) =>
  updateDoc(bookRef(bookId), { [`meta.memberRoles.${email}`]: permission });

export const removeBookMember = (bookId, email) =>
  updateDoc(bookRef(bookId), {
    "meta.memberEmails": arrayRemove(email),
    [`meta.memberRoles.${email}`]: deleteField(),
  });

// ── Sotto-collezione recipes: un documento per ricetta ──
// recipe.id (numero nella demo, stringa uid("r") altrove) diventa l'id
// documento come stringa — è solo un identificatore stabile, il tipo non
// conta per il resto dell'app.
const isBase64Photo = (v) => typeof v === "string" && v.startsWith("data:");
const isSectioned = (arr) => Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object" && "section" in arr[0];

// Carica le foto di un singolo step (se ne ha, in un array `photos`) e
// ritorna lo step con le stesse foto sostituite dalle download URL.
const uploadStepPhotos = async (bookId, recipeId, step, stepKey) => {
  if (typeof step === "string" || !Array.isArray(step.photos)) return step;
  const photos = await Promise.all(step.photos.map((p, j) =>
    isBase64Photo(p) ? uploadPhoto(stepPhotoPath(bookId, recipeId, stepKey, j), p) : p
  ));
  return { ...step, photos };
};

// steps può essere piatto ([step,...]) o sezionato ([{section,items},...])
// — stessa ambiguità già presente su ingredients (vedi mapIngredientsStruct
// in utils/helpers.js). stepKey resta univoco in entrambi i casi.
const uploadAllStepPhotos = async (bookId, recipeId, steps) => {
  if (!Array.isArray(steps)) return steps;
  if (isSectioned(steps)) {
    return Promise.all(steps.map(async (sec, si) => ({
      ...sec,
      items: await Promise.all((sec.items || []).map((st, ii) => uploadStepPhotos(bookId, recipeId, st, `${si}_${ii}`))),
    })));
  }
  return Promise.all(steps.map((st, i) => uploadStepPhotos(bookId, recipeId, st, i)));
};

// I ricordi hanno una foto sola: può essere un'emoji (stringa breve,
// photoIsImage:false) o una foto vera (base64, photoIsImage:true).
// Solo il secondo caso va caricato su Storage.
const uploadMemoryPhotos = async (bookId, recipeId, memories) => {
  if (!Array.isArray(memories)) return memories;
  return Promise.all(memories.map(async (mem) => {
    if (!mem.photoIsImage || !isBase64Photo(mem.photo)) return mem;
    const url = await uploadPhoto(memoryPhotoPath(bookId, recipeId, mem.id), mem.photo);
    return { ...mem, photo: url };
  }));
};

// Sostituisce ogni foto base64 della ricetta (piatto, step, ricordi) con
// la sua download URL su Storage — mai base64 dentro al documento
// Firestore. Le foto già caricate (URL) o assenti (null) restano intatte.
const uploadRecipePhotos = async (bookId, recipe) => {
  const out = { ...recipe };
  if (isBase64Photo(out.dishPhoto)) {
    out.dishPhoto = await uploadPhoto(dishPhotoPath(bookId, recipe.id), out.dishPhoto);
  }
  out.steps = await uploadAllStepPhotos(bookId, recipe.id, out.steps);
  out.memories = await uploadMemoryPhotos(bookId, recipe.id, out.memories);
  return out;
};

export const saveRecipe = async (bookId, recipe) => {
  const withUploadedPhotos = await uploadRecipePhotos(bookId, recipe);
  return setDoc(recipeRef(bookId, withUploadedPhotos.id), withUploadedPhotos);
};

export const deleteRecipe = (bookId, recipeId) =>
  deleteDoc(recipeRef(bookId, recipeId));

export const loadAllRecipes = async (bookId) => {
  const snap = await getDocs(recipesCol(bookId));
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
