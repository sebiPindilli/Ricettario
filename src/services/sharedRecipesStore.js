// Condivisione di una singola ricetta via link — vedi firestore.rules
// (collezione sharedRecipes) per il perché della struttura a due parti:
// un documento "di stato" sempre leggibile da chi è whitelistato (per poter
// mostrare un messaggio preciso su scaduto/revocato/non-destinatario) e una
// sottocollezione content/ con il contenuto vero, protetto dalle condizioni
// reali. Le foto (se incluse) vengono duplicate, mai referenziate: un link
// è una fotografia immutabile, e i path Storage delle foto originali
// vengono sovrascritti ad ogni modifica della ricetta di partenza.
import { db } from "../firebase.js";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, Timestamp,
} from "firebase/firestore";
import { isSectioned, stepPhotosOf } from "../utils/helpers.js";
import { duplicatePhoto, deletePhoto, sharedDishPhotoPath, sharedStepPhotoPath, sharedMemoryPhotoPath } from "./photoStore.js";
import { encodeEquivalences, decodeEquivalences } from "./bookStore.js";

const SHARE_DAYS = 30;

const statusRef = (shareId) => doc(db, "sharedRecipes", shareId);
const contentRef = (shareId) => doc(db, "sharedRecipes", shareId, "content", "data");

// Rimuove foto/photos dagli step senza duplicarle (caso "non includere
// foto"): converte l'item a stringa/{text,duration} pulito, mai lasciando
// URL del libro di origine nella copia condivisa.
const stripStepsPhotos = (steps) => {
  if (!Array.isArray(steps)) return steps;
  const strip = (it) => {
    if (typeof it === "string") return it;
    const { text, duration } = it || {};
    return duration != null ? { text: text || "", duration } : (text || "");
  };
  return isSectioned(steps)
    ? steps.map(sec => ({ ...sec, items: (sec.items || []).map(strip) }))
    : steps.map(strip);
};

// Duplica le foto di una ricetta (piatto, step, ricordi con foto vera) su
// path scelti dal chiamante — riusata sia per creare una condivisione
// (verso sharedRecipes/{shareId}/…, vedi createSharedRecipe) sia per
// "aggiungi al mio ricettario" (verso books/{bookId}/recipes/{recipeId}/…,
// vedi addSharedRecipeToBook in ricettario-v23.jsx): senza questo secondo
// passaggio, una ricetta aggiunta al proprio libro conterebbe ancora sulle
// foto della condivisione, che spariscono quando il link scade o viene
// revocato — una ricetta "aggiunta" deve essere autonoma da lì in poi.
// dishPath/stepPath/memoryPath: funzioni che generano i path Storage.
// Ritorna { recipe, photoPaths } (photoPaths: tutti i path scritti).
export const duplicateRecipePhotos = async (recipe, { dishPath, stepPath, memoryPath }) => {
  const out = { ...recipe };
  const photoPaths = [];

  if (out.dishPhoto) {
    const path = dishPath();
    out.dishPhoto = await duplicatePhoto(out.dishPhoto, path);
    photoPaths.push(path);
  }

  if (Array.isArray(out.steps)) {
    let idx = 0;
    const dupStep = async (it) => {
      const photos = stepPhotosOf(it);
      const i = idx++;
      if (photos.length === 0) return typeof it === "string" ? it : { text: it.text || "", ...(it.duration != null ? { duration: it.duration } : {}) };
      const newPhotos = [];
      for (let p = 0; p < photos.length; p++) {
        const path = stepPath(i, p);
        newPhotos.push(await duplicatePhoto(photos[p], path));
        photoPaths.push(path);
      }
      return { text: typeof it === "string" ? it : (it.text || ""), photos: newPhotos, ...(it.duration != null ? { duration: it.duration } : {}) };
    };
    if (isSectioned(out.steps)) {
      const secs = [];
      for (const sec of out.steps) {
        const items = [];
        for (const it of sec.items || []) items.push(await dupStep(it));
        secs.push({ ...sec, items });
      }
      out.steps = secs;
    } else {
      const items = [];
      for (const it of out.steps) items.push(await dupStep(it));
      out.steps = items;
    }
  }

  if (Array.isArray(out.memories) && out.memories.length > 0) {
    const mems = [];
    for (const mem of out.memories) {
      if (mem.photoIsImage && mem.photo) {
        const path = memoryPath(mem.id);
        const newPhoto = await duplicatePhoto(mem.photo, path);
        photoPaths.push(path);
        mems.push({ ...mem, photo: newPhoto });
      } else {
        mems.push(mem);
      }
    }
    out.memories = mems;
  }

  return { recipe: out, photoPaths };
};

// Crea una condivisione: scrive prima il documento di stato, poi il
// contenuto (le regole richiedono che lo stato esista già, per verificare
// che sharedBy corrisponda a chi scrive). Ritorna lo shareId, con cui si
// costruisce il link (?shared={shareId}).
// includePhotos governa insieme foto (piatto/step) E ricordi collegati —
// nella richiesta originale sono un'unica voce di scelta ("Foto"), a
// differenza dell'export a codice che li tiene distinti.
export const createSharedRecipe = async ({
  recipe, ingredientData, sharedBy, visibility, allowedEmails,
  sourceBookId, sourceRecipeId, includePhotos,
}) => {
  const shareId = doc(collection(db, "sharedRecipes")).id;
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + SHARE_DAYS * 24 * 60 * 60 * 1000);

  let sharedRecipe = { ...recipe };
  delete sharedRecipe.comments;
  delete sharedRecipe.favorite;
  delete sharedRecipe.id;
  sharedRecipe.memories = includePhotos && Array.isArray(recipe.memories) ? recipe.memories : [];
  let photoPaths = [];

  if (includePhotos) {
    const dup = await duplicateRecipePhotos(sharedRecipe, {
      dishPath: () => sharedDishPhotoPath(shareId),
      stepPath: (i, p) => sharedStepPhotoPath(shareId, i, p),
      memoryPath: (memId) => sharedMemoryPhotoPath(shareId, memId),
    });
    sharedRecipe = dup.recipe;
    photoPaths = dup.photoPaths;
  } else {
    // memories è già [] in questo ramo (vedi sopra) — niente da ripulire.
    sharedRecipe.dishPhoto = null;
    sharedRecipe.steps = stripStepsPhotos(sharedRecipe.steps);
  }

  // includedData vive nello stato (non nel contenuto): serve alla
  // schermata "I miei link condivisi" per mostrare cosa include ciascun
  // link senza dover leggere il contenuto protetto di ognuno.
  await setDoc(statusRef(shareId), {
    recipeTitle: recipe.title || "",
    sharedBy, sharedAt: now, expiresAt, revoked: false,
    visibility, allowedEmails: allowedEmails || [],
    sourceBookId, sourceRecipeId,
    includedData: { ingredients: !!ingredientData, photos: !!includePhotos },
  });
  // equivalences può usare la chiave "" (unità implicita, es. "1 uovo" ≈
  // 60g) — Firestore rifiuta le chiavi di mappa vuote, va codificata prima
  // di scrivere (stessa funzione già usata da saveBookSystem, mai una
  // seconda implementazione) o la scrittura fallisce quando la condivisione
  // include i dati ingredienti.
  const encodedIngredientData = ingredientData
    ? { ...ingredientData, equivalences: encodeEquivalences(ingredientData.equivalences) }
    : null;
  await setDoc(contentRef(shareId), {
    recipe: sharedRecipe,
    ingredientData: encodedIngredientData,
    photoPaths,
  });

  return shareId;
};

// Documento "di stato" — sempre leggibile da chi è whitelistato, anche a
// link scaduto/revocato/non per te: è ciò che permette al client di
// mostrare un messaggio preciso invece di un generico errore di permessi.
export const loadSharedStatus = async (shareId) => {
  const snap = await getDoc(statusRef(shareId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Contenuto vero — può lanciare un errore di permessi (scaduto/revocato/
// non per te): va chiamato solo dopo aver già valutato lo stato lato
// client, e comunque avvolto in try/catch a difesa di eventuali corse
// (es. revoca avvenuta proprio tra le due letture).
export const loadSharedContent = async (shareId) => {
  const snap = await getDoc(contentRef(shareId));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Decodifica simmetrica a createSharedRecipe: da qui in poi (schermata
  // di apertura, aggiunta al proprio libro) equivalences è sempre nella
  // forma "decodificata" che il resto dell'app si aspetta — nessun
  // chiamante deve sapere della codifica per Firestore.
  if (data.ingredientData) {
    data.ingredientData = { ...data.ingredientData, equivalences: decodeEquivalences(data.ingredientData.equivalences) };
  }
  return data;
};

// Condivisioni create da un'email — per la schermata "I miei link
// condivisi". Ordinate lato client (evita di richiedere un indice
// composito where+orderBy per una lista che resta comunque piccola).
export const listMySharedRecipes = async (email) => {
  const q = query(collection(db, "sharedRecipes"), where("sharedBy", "==", email));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.sharedAt?.toMillis?.() ?? 0) - (a.sharedAt?.toMillis?.() ?? 0));
};

// Modifica destinatari/visibilità di un link già creato, senza doverlo
// revocare e rimandarne uno nuovo a tutti.
export const updateSharedRecipeAccess = (shareId, { visibility, allowedEmails }) =>
  updateDoc(statusRef(shareId), { visibility, allowedEmails });

export const revokeSharedRecipe = (shareId) =>
  updateDoc(statusRef(shareId), { revoked: true });

// Pulizia reale di una condivisione scaduta o revocata: foto duplicate,
// contenuto, infine lo stato. Va chiamata solo su condivisioni proprie
// (sharedBy === chi chiama) — le regole lo impongono comunque, questa è
// solo l'implementazione lato client, pensata per girare quando il
// proprietario apre "I miei link condivisi" (nessuna pulizia schedulata
// lato server: non scompare da sola se non viene mai riaperta quella
// schermata — limite noto, accettato, stesso tipo di quello già esistente
// per le foto orfane di una ricetta eliminata).
export const deleteSharedRecipeFully = async (shareId) => {
  const content = await getDoc(contentRef(shareId));
  const photoPaths = content.exists() ? (content.data().photoPaths || []) : [];
  await Promise.all(photoPaths.map(p => deletePhoto(p).catch(() => {})));
  if (content.exists()) await deleteDoc(contentRef(shareId));
  await deleteDoc(statusRef(shareId));
};
