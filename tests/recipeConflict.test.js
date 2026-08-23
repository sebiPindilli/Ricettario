// Verifica il rilevamento conflitti sulle ricette (Fase D, stesso disegno
// di system/lista spesa — vedi systemFlush.test.js/shoppingListFlush.test.js)
// contro l'emulator Firestore locale — non il progetto di produzione.
// Si esegue con `npm run test:rules`.
//
// Le ricette sono già un documento per ricetta: il rilevamento qui è
// sull'intero documento (non per singola voce come per system), perché è
// già la granularità giusta — un conflitto tocca al più una ricetta, mai
// si propaga ad altre (verificato esplicitamente sotto).
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { initializeTestEnvironment, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc, runTransaction } from "firebase/firestore";
import { deepEqual } from "../src/utils/dirtyTracking.js";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ricettario-recipeconflict-test",
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} { allow read, write: if true; }
          }
        }
      `,
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const dbFor = () => testEnv.unauthenticatedContext().firestore();
const recipeRef = (db, bookId, id) => doc(db, "books", bookId, "recipes", id);

const recipe = (id, extra = {}) => ({ id, title: `Ricetta ${id}`, ingredients: [], steps: [], servings: 4, prepTime: 10, cookTime: 20, ...extra });

const omitMetaLocal = (r) => {
  if (!r) return r;
  return Object.fromEntries(Object.entries(r).filter(([k]) => k !== "lastEditedBy" && k !== "lastEditedAt"));
};

const saveRecipeOnlineLocal = async (db, bookId, recipeVal, baseline, editedBy) => {
  const ref = recipeRef(db, bookId, recipeVal.id);
  const stamped = { ...recipeVal, lastEditedBy: editedBy, lastEditedAt: Date.now() };
  let conflict = null;
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const server = snap.exists() ? snap.data() : null;
    if (server && baseline && !deepEqual(omitMetaLocal(server), omitMetaLocal(baseline))) {
      conflict = server;
      return;
    }
    transaction.set(ref, stamped);
  });
  return { conflict, saved: conflict ? null : stamped };
};

const deleteRecipeOnlineLocal = async (db, bookId, recipeId, baseline) => {
  const ref = recipeRef(db, bookId, recipeId);
  let conflict = null;
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const server = snap.exists() ? snap.data() : null;
    if (server && baseline && !deepEqual(omitMetaLocal(server), omitMetaLocal(baseline))) {
      conflict = server;
      return;
    }
    if (server) transaction.delete(ref);
  });
  return { conflict };
};

describe("ricette — conflitto di modifica sulla stessa ricetta", () => {
  it("il secondo client viene rifiutato, nessun dato corrotto", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = recipe("r1");
    await assertSucceeds(setDoc(recipeRef(db, bookId, "r1"), baseline));

    const c1Version = { ...baseline, title: "Titolo di Client 1" };
    const c2Version = { ...baseline, title: "Titolo di Client 2" };

    const { conflict: conflict1 } = await saveRecipeOnlineLocal(db, bookId, c1Version, baseline, "client1@test.it");
    expect(conflict1).toBeNull();

    // Client 2 parte ancora dalla baseline vecchia (non sa che client1 ha già scritto)
    const { conflict: conflict2 } = await saveRecipeOnlineLocal(db, bookId, c2Version, baseline, "client2@test.it");
    expect(conflict2).not.toBeNull();
    expect(conflict2.title).toBe("Titolo di Client 1");
    expect(conflict2.lastEditedBy).toBe("client1@test.it");

    const snap = await getDoc(recipeRef(db, bookId, "r1"));
    expect(snap.data().title).toBe("Titolo di Client 1"); // mai un mix tra le due versioni
  });
});

describe("ricette — ricette diverse, nessuna interferenza", () => {
  it("modifiche concorrenti a due ricette diverse non si scontrano mai", async () => {
    const db = dbFor();
    const bookId = "book1";
    const r1 = recipe("r1"), r2 = recipe("r2");
    await assertSucceeds(setDoc(recipeRef(db, bookId, "r1"), r1));
    await assertSucceeds(setDoc(recipeRef(db, bookId, "r2"), r2));

    const { conflict: c1 } = await saveRecipeOnlineLocal(db, bookId, { ...r1, title: "Nuovo titolo r1" }, r1, "a@test.it");
    const { conflict: c2 } = await saveRecipeOnlineLocal(db, bookId, { ...r2, title: "Nuovo titolo r2" }, r2, "b@test.it");
    expect(c1).toBeNull();
    expect(c2).toBeNull();

    const snap1 = await getDoc(recipeRef(db, bookId, "r1"));
    const snap2 = await getDoc(recipeRef(db, bookId, "r2"));
    expect(snap1.data().title).toBe("Nuovo titolo r1");
    expect(snap2.data().title).toBe("Nuovo titolo r2");
  });
});

describe("ricette — eliminazione in conflitto con una modifica concorrente", () => {
  it("l'eliminazione viene rifiutata, la ricetta resta con la versione modificata", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = recipe("r1");
    await assertSucceeds(setDoc(recipeRef(db, bookId, "r1"), baseline));

    // Un altro client modifica la ricetta
    const updated = { ...baseline, title: "Modificata da qualcun altro" };
    await saveRecipeOnlineLocal(db, bookId, updated, baseline, "altro@test.it");

    // Questo client, ignaro, prova a eliminarla partendo dalla baseline vecchia
    const { conflict } = await deleteRecipeOnlineLocal(db, bookId, "r1", baseline);
    expect(conflict).not.toBeNull();
    expect(conflict.title).toBe("Modificata da qualcun altro");

    const snap = await getDoc(recipeRef(db, bookId, "r1"));
    expect(snap.exists()).toBe(true); // non eliminata
    expect(snap.data().title).toBe("Modificata da qualcun altro");
  });

  it("senza conflitto, l'eliminazione procede normalmente", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = recipe("r1");
    await assertSucceeds(setDoc(recipeRef(db, bookId, "r1"), baseline));

    const { conflict } = await deleteRecipeOnlineLocal(db, bookId, "r1", baseline);
    expect(conflict).toBeNull();

    const snap = await getDoc(recipeRef(db, bookId, "r1"));
    expect(snap.exists()).toBe(false);
  });
});

describe("ricette — scrittura offline (nessun rilevamento conflitti)", () => {
  it("scrive comunque, senza controllo — stessa scelta di system/lista spesa", async () => {
    const db = dbFor();
    const bookId = "book1";
    const baseline = recipe("r1");
    await assertSucceeds(setDoc(recipeRef(db, bookId, "r1"), baseline));

    // Un altro client modifica nel frattempo
    await setDoc(recipeRef(db, bookId, "r1"), { ...baseline, title: "Modificata da altri" });

    // Scrittura offline: plain setDoc, nessuna transazione — sovrascrive
    // senza controllo (comportamento noto e accettato, identico a oggi)
    await deleteDoc(recipeRef(db, bookId, "r1"));
    await setDoc(recipeRef(db, bookId, "r1"), { ...baseline, title: "La mia versione offline", lastEditedBy: "me@test.it", lastEditedAt: Date.now() });

    const snap = await getDoc(recipeRef(db, bookId, "r1"));
    expect(snap.data().title).toBe("La mia versione offline");
  });
});
