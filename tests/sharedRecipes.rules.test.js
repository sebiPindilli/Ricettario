// Test delle regole Firestore per sharedRecipes/{shareId} (+ sottocollezione
// content/) contro l'emulator locale. Si esegue con `npm run test:rules`,
// che avvia e ferma l'emulator automaticamente attorno a Vitest (vedi
// package.json) — questo file va aggiunto esplicitamente a quello script,
// non c'è discovery automatica.
import { readFileSync } from "node:fs";
import { beforeAll, beforeEach, afterAll, describe, it } from "vitest";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ricettario-shared-recipes-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
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

const seed = (fn) => testEnv.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
const asUser = (email) => testEnv.authenticatedContext(email, { email }).firestore();

const seedAllowlist = (db, ...emails) =>
  Promise.all(emails.map((e) => setDoc(doc(db, `allowlist/${e}`), { role: "base" })));

const inDays = (n) => Timestamp.fromMillis(Date.now() + n * 24 * 60 * 60 * 1000);

const baseStatus = (overrides = {}) => ({
  recipeTitle: "Torta di mele",
  sharedBy: "owner@test.it",
  sharedAt: inDays(0),
  expiresAt: inDays(30),
  revoked: false,
  visibility: "anyone",
  allowedEmails: [],
  sourceBookId: "book1",
  sourceRecipeId: "r1",
  includedData: { ingredients: false, photos: false },
  ...overrides,
});

const baseContent = (overrides = {}) => ({
  recipe: { title: "Torta di mele", ingredients: [], steps: [] },
  ...overrides,
});

describe("sharedRecipes — lettura del documento di stato", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "owner@test.it", "altro@test.it");
      await setDoc(doc(db, "sharedRecipes/s1"), baseStatus());
    })
  );

  it("qualunque utente whitelistato legge lo stato, anche se non è tra i destinatari", async () => {
    await assertSucceeds(getDoc(doc(asUser("altro@test.it"), "sharedRecipes/s1")));
  });

  it("un utente non autenticato non legge nulla", async () => {
    await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), "sharedRecipes/s1")));
  });
});

describe("sharedRecipes — creazione del documento di stato", () => {
  beforeEach(() => seed((db) => seedAllowlist(db, "owner@test.it")));

  it("un utente whitelistato crea una condivisione con sharedBy = se stesso", async () => {
    await assertSucceeds(setDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), baseStatus()));
  });

  it("non si può creare una condivisione con sharedBy diverso dal proprio account", async () => {
    await assertFails(setDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), baseStatus({ sharedBy: "altro@test.it" })));
  });

  it("non si può creare già revocata", async () => {
    await assertFails(setDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), baseStatus({ revoked: true })));
  });

  it("la visibilità deve essere 'anyone' o 'restricted'", async () => {
    await assertFails(setDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), baseStatus({ visibility: "public" })));
  });

  it("la scadenza non può essere già nel passato", async () => {
    await assertFails(setDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), baseStatus({ expiresAt: inDays(-1) })));
  });

  it("la scadenza non può superare i 31 giorni (margine sui 30 previsti)", async () => {
    await assertFails(setDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), baseStatus({ expiresAt: inDays(90) })));
  });

  it("un campo non previsto nello schema fa fallire la creazione", async () => {
    await assertFails(setDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), baseStatus({ extra: "no" })));
  });
});

describe("sharedRecipes — modifica del documento di stato: solo destinatari/visibilità/revoca, solo da chi ha condiviso", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "owner@test.it", "altro@test.it");
      await setDoc(doc(db, "sharedRecipes/s1"), baseStatus());
    })
  );

  it("chi ha condiviso può aggiungere un destinatario e passare a 'restricted'", async () => {
    await assertSucceeds(updateDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), {
      visibility: "restricted", allowedEmails: ["invitato@test.it"],
    }));
  });

  it("chi ha condiviso può revocare", async () => {
    await assertSucceeds(updateDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), { revoked: true }));
  });

  it("un altro utente whitelistato non può modificare una condivisione che non è sua", async () => {
    await assertFails(updateDoc(doc(asUser("altro@test.it"), "sharedRecipes/s1"), { revoked: true }));
  });

  it("nemmeno chi ha condiviso può modificare il titolo o la scadenza", async () => {
    await assertFails(updateDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), { recipeTitle: "Altro titolo" }));
    await assertFails(updateDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1"), { expiresAt: inDays(60) }));
  });
});

describe("sharedRecipes — eliminazione del documento di stato: solo chi ha condiviso", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "owner@test.it", "altro@test.it");
      await setDoc(doc(db, "sharedRecipes/s1"), baseStatus());
    })
  );

  it("chi ha condiviso può eliminare (pulizia alla scadenza/revoca)", async () => {
    await assertSucceeds(deleteDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1")));
  });

  it("un altro utente whitelistato non può eliminare una condivisione altrui", async () => {
    await assertFails(deleteDoc(doc(asUser("altro@test.it"), "sharedRecipes/s1")));
  });
});

describe("sharedRecipes/content — lettura per visibilità 'anyone'", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "owner@test.it", "chiunque@test.it");
      await setDoc(doc(db, "sharedRecipes/s1"), baseStatus());
      await setDoc(doc(db, "sharedRecipes/s1/content/data"), baseContent());
    })
  );

  it("qualunque utente whitelistato legge il contenuto", async () => {
    await assertSucceeds(getDoc(doc(asUser("chiunque@test.it"), "sharedRecipes/s1/content/data")));
  });
});

describe("sharedRecipes/content — lettura per visibilità 'restricted'", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "owner@test.it", "invitato@test.it", "non-invitato@test.it");
      await setDoc(doc(db, "sharedRecipes/s1"), baseStatus({ visibility: "restricted", allowedEmails: ["invitato@test.it"] }));
      await setDoc(doc(db, "sharedRecipes/s1/content/data"), baseContent());
    })
  );

  it("un destinatario elencato legge il contenuto", async () => {
    await assertSucceeds(getDoc(doc(asUser("invitato@test.it"), "sharedRecipes/s1/content/data")));
  });

  it("chi ha condiviso legge sempre il proprio contenuto, anche se non è nella lista destinatari", async () => {
    await assertSucceeds(getDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1/content/data")));
  });

  it("un whitelistato non tra i destinatari NON legge il contenuto (solo lo stato)", async () => {
    await assertFails(getDoc(doc(asUser("non-invitato@test.it"), "sharedRecipes/s1/content/data")));
    await assertSucceeds(getDoc(doc(asUser("non-invitato@test.it"), "sharedRecipes/s1")));
  });
});

describe("sharedRecipes/content — scaduto o revocato: bloccato per chiunque tranne chi ha condiviso", () => {
  // Chi ha condiviso deve continuare a leggere il proprio contenuto anche a
  // link non più valido: serve alla pulizia (sapere quali foto cancellare,
  // vedi photoPaths) ed è comunque ragionevole poter rivedere ciò che si è
  // condiviso. Solo i DESTINATARI perdono l'accesso.
  it("scaduto: un destinatario non legge più il contenuto, chi ha condiviso sì", async () => {
    await seed(async (db) => {
      await seedAllowlist(db, "owner@test.it", "invitato@test.it");
      await setDoc(doc(db, "sharedRecipes/s1"), baseStatus({ expiresAt: inDays(-1) }));
      await setDoc(doc(db, "sharedRecipes/s1/content/data"), baseContent());
    });
    await assertFails(getDoc(doc(asUser("invitato@test.it"), "sharedRecipes/s1/content/data")));
    await assertSucceeds(getDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1/content/data")));
    // Lo stato resta comunque leggibile a tutti, per mostrare "link scaduto" invece di un errore generico.
    await assertSucceeds(getDoc(doc(asUser("invitato@test.it"), "sharedRecipes/s1")));
  });

  it("revocato: un destinatario non legge più il contenuto, chi ha condiviso sì", async () => {
    await seed(async (db) => {
      await seedAllowlist(db, "owner@test.it", "invitato@test.it");
      await setDoc(doc(db, "sharedRecipes/s1"), baseStatus({ revoked: true }));
      await setDoc(doc(db, "sharedRecipes/s1/content/data"), baseContent());
    });
    await assertFails(getDoc(doc(asUser("invitato@test.it"), "sharedRecipes/s1/content/data")));
    await assertSucceeds(getDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1/content/data")));
    await assertSucceeds(getDoc(doc(asUser("invitato@test.it"), "sharedRecipes/s1")));
  });
});

describe("sharedRecipes/content — creazione ed eliminazione solo da chi ha condiviso, mai un aggiornamento", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "owner@test.it", "altro@test.it");
      await setDoc(doc(db, "sharedRecipes/s1"), baseStatus());
    })
  );

  it("chi ha condiviso crea il contenuto", async () => {
    await assertSucceeds(setDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1/content/data"), baseContent()));
  });

  it("un altro utente non può creare contenuto su una condivisione altrui", async () => {
    await assertFails(setDoc(doc(asUser("altro@test.it"), "sharedRecipes/s1/content/data"), baseContent()));
  });

  it("il contenuto non è mai modificabile una volta creato, nemmeno da chi ha condiviso", async () => {
    await seed((db) => setDoc(doc(db, "sharedRecipes/s1/content/data"), baseContent()));
    await assertFails(updateDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1/content/data"), {
      "recipe.title": "Titolo modificato",
    }));
  });

  it("chi ha condiviso può eliminare il contenuto (pulizia)", async () => {
    await seed((db) => setDoc(doc(db, "sharedRecipes/s1/content/data"), baseContent()));
    await assertSucceeds(deleteDoc(doc(asUser("owner@test.it"), "sharedRecipes/s1/content/data")));
  });
});
