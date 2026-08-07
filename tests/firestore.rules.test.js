// Test delle regole Firestore contro l'emulator locale (non contro il
// progetto reale). Si esegue con `npm run test:rules`, che avvia e ferma
// l'emulator automaticamente attorno a Vitest (vedi package.json).
import { readFileSync } from "node:fs";
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ricettario-rules-test",
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

// Ogni test parte da Firestore vuoto — ogni describe riseminarà i propri
// dati nel proprio beforeEach (mai in beforeAll: girerebbe una sola volta
// e questo clear lo spazzerebbe via prima ancora del primo test).
beforeEach(async () => {
  await testEnv.clearFirestore();
});

const seed = (fn) => testEnv.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
const asUser = (email) => testEnv.authenticatedContext(email, { email }).firestore();

const baseMeta = (overrides = {}) => ({
  name: "Libro di prova", type: "condiviso", owner: "owner@test.it", bookTheme: "classic",
  memberEmails: [], memberRoles: {},
  ...overrides,
});

// Aggiunge alla whitelist il proprietario più ogni email passata — tutti
// gli attori di un test devono essere whitelisted, non solo il proprietario:
// isWhitelisted() è il primo cancello di ogni regola.
const seedAllowlist = (db, ...emails) =>
  Promise.all(["owner@test.it", ...emails].map((e) => setDoc(doc(db, `allowlist/${e}`), { role: "base" })));

describe("firestore.rules — baseline (lettura libri)", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "stranger@test.it");
      await setDoc(doc(db, "books/book1"), { meta: baseMeta() });
    })
  );

  it("il proprietario legge il proprio libro", async () => {
    await assertSucceeds(getDoc(doc(asUser("owner@test.it"), "books/book1")));
  });

  it("un estraneo (whitelisted ma non owner/membro) non legge il libro altrui", async () => {
    await assertFails(getDoc(doc(asUser("stranger@test.it"), "books/book1")));
  });

  it("un utente non autenticato non legge nulla", async () => {
    await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), "books/book1")));
  });

  it("il client non può creare un libro direttamente (solo /api/create-book)", async () => {
    await assertFails(setDoc(doc(asUser("owner@test.it"), "books/book2"), { meta: baseMeta({ type: "personale" }) }));
  });
});

describe("firestore.rules — meta.memberEmails/memberRoles mai scrivibili dal client", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db);
      await setDoc(doc(db, "books/book1"), { meta: baseMeta() });
    })
  );

  it("nemmeno il proprietario può aggiungere un membro via client SDK", async () => {
    await assertFails(updateDoc(doc(asUser("owner@test.it"), "books/book1"), {
      "meta.memberEmails": arrayUnion("nuovo@test.it"),
    }));
  });

  it("il proprietario può ancora rinominare il libro", async () => {
    await assertSucceeds(updateDoc(doc(asUser("owner@test.it"), "books/book1"), { "meta.name": "Nuovo nome" }));
  });
});

describe("firestore.rules — creazione/modifica ricette per ruolo", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "collab@test.it", "red@test.it", "lett@test.it", "legacyedit@test.it");
      await setDoc(doc(db, "books/book1"), { meta: baseMeta({
        memberEmails: ["collab@test.it", "red@test.it", "lett@test.it", "legacyedit@test.it"],
        memberRoles: { "collab@test.it": "collaboratore", "red@test.it": "redattore", "lett@test.it": "lettore", "legacyedit@test.it": "edit" },
      }) });
    })
  );

  it("il redattore può creare una ricetta", async () => {
    await assertSucceeds(setDoc(doc(asUser("red@test.it"), "books/book1/recipes/r1"), { title: "Torta", memories: [] }));
  });

  it("un membro legacy 'edit' può ancora creare/modificare (alias → redattore)", async () => {
    await assertSucceeds(setDoc(doc(asUser("legacyedit@test.it"), "books/book1/recipes/r1"), { title: "Torta", memories: [] }));
  });

  it("il lettore non può creare una ricetta", async () => {
    await assertFails(setDoc(doc(asUser("lett@test.it"), "books/book1/recipes/r1"), { title: "Torta", memories: [] }));
  });
});

describe("firestore.rules — eliminazione ricette: solo proprietario e collaboratore", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "collab@test.it", "red@test.it", "legacyedit@test.it");
      await setDoc(doc(db, "books/book1"), { meta: baseMeta({
        memberEmails: ["collab@test.it", "red@test.it", "legacyedit@test.it"],
        memberRoles: { "collab@test.it": "collaboratore", "red@test.it": "redattore", "legacyedit@test.it": "edit" },
      }) });
      await setDoc(doc(db, "books/book1/recipes/r1"), { title: "Torta", memories: [] });
    })
  );

  it("il proprietario elimina una ricetta", async () => {
    await assertSucceeds(deleteDoc(doc(asUser("owner@test.it"), "books/book1/recipes/r1")));
  });

  it("il collaboratore elimina una ricetta", async () => {
    await assertSucceeds(deleteDoc(doc(asUser("collab@test.it"), "books/book1/recipes/r1")));
  });

  it("il redattore NON può eliminare una ricetta", async () => {
    await assertFails(deleteDoc(doc(asUser("red@test.it"), "books/book1/recipes/r1")));
  });

  it("un membro legacy 'edit' NON può eliminare (equivale a redattore, non a collaboratore)", async () => {
    await assertFails(deleteDoc(doc(asUser("legacyedit@test.it"), "books/book1/recipes/r1")));
  });
});

describe("firestore.rules — rimozione di un ricordo: come una delete, non come una modifica", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "collab@test.it", "red@test.it");
      await setDoc(doc(db, "books/book1"), { meta: baseMeta({
        memberEmails: ["collab@test.it", "red@test.it"],
        memberRoles: { "collab@test.it": "collaboratore", "red@test.it": "redattore" },
      }) });
      await setDoc(doc(db, "books/book1/recipes/r1"), { title: "Torta", memories: [{ id: "m1" }] });
    })
  );

  it("il redattore può aggiungere un ricordo (l'array cresce)", async () => {
    await assertSucceeds(updateDoc(doc(asUser("red@test.it"), "books/book1/recipes/r1"), {
      memories: [{ id: "m1" }, { id: "m2" }],
    }));
  });

  it("il redattore può modificare un ricordo esistente (stessa lunghezza array)", async () => {
    await assertSucceeds(updateDoc(doc(asUser("red@test.it"), "books/book1/recipes/r1"), {
      memories: [{ id: "m1", caption: "modificato" }],
    }));
  });

  it("il redattore NON può rimuovere un ricordo (l'array si accorcia)", async () => {
    await assertFails(updateDoc(doc(asUser("red@test.it"), "books/book1/recipes/r1"), { memories: [] }));
  });

  it("il collaboratore può rimuovere un ricordo", async () => {
    await assertSucceeds(updateDoc(doc(asUser("collab@test.it"), "books/book1/recipes/r1"), { memories: [] }));
  });
});

describe("firestore.rules — Organizza (system/data): il redattore ha accesso pieno, il lettore no", () => {
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "red@test.it", "lett@test.it");
      await setDoc(doc(db, "books/book1"), { meta: baseMeta({
        memberEmails: ["red@test.it", "lett@test.it"],
        memberRoles: { "red@test.it": "redattore", "lett@test.it": "lettore" },
      }) });
      await setDoc(doc(db, "books/book1/system/data"), { aggregates: [] });
    })
  );

  it("il redattore può scrivere su Organizza (aggregati/categorie/ecc.)", async () => {
    await assertSucceeds(setDoc(doc(asUser("red@test.it"), "books/book1/system/data"), { aggregates: [{ id: "a1" }] }));
  });

  it("il lettore non può scrivere su Organizza", async () => {
    await assertFails(setDoc(doc(asUser("lett@test.it"), "books/book1/system/data"), { aggregates: [{ id: "a1" }] }));
  });

  it("il lettore può comunque leggere Organizza", async () => {
    await assertSucceeds(getDoc(doc(asUser("lett@test.it"), "books/book1/system/data")));
  });
});

describe("firestore.rules — migrazione alias legacy: nessuna riscrittura dei dati esistenti", () => {
  // Un libro "vecchio schema" con membri salvati letteralmente come "edit"/
  // "read" (mai passati da /api/manage-book-member, quindi mai normalizzati
  // a scrittura) deve continuare a funzionare esattamente come se fosse
  // stato scritto con "redattore"/"lettore" — le regole interpretano
  // l'alias al volo (isEditorRole), non lo riscrivono mai nel documento.
  beforeEach(() =>
    seed(async (db) => {
      await seedAllowlist(db, "legacyedit@test.it", "legacyread@test.it");
      await setDoc(doc(db, "books/book1"), { meta: baseMeta({
        memberEmails: ["legacyedit@test.it", "legacyread@test.it"],
        memberRoles: { "legacyedit@test.it": "edit", "legacyread@test.it": "read" },
      }) });
      await setDoc(doc(db, "books/book1/recipes/r1"), { title: "Torta", memories: [{ id: "m1" }] });
    })
  );

  it("il membro legacy 'edit' legge e modifica come un redattore", async () => {
    await assertSucceeds(getDoc(doc(asUser("legacyedit@test.it"), "books/book1")));
    await assertSucceeds(setDoc(doc(asUser("legacyedit@test.it"), "books/book1/recipes/r2"), { title: "Biscotti", memories: [] }));
    await assertSucceeds(updateDoc(doc(asUser("legacyedit@test.it"), "books/book1/recipes/r1"), { title: "Torta modificata" }));
  });

  it("il membro legacy 'edit' NON elimina (equivale a redattore, non a collaboratore)", async () => {
    await assertFails(deleteDoc(doc(asUser("legacyedit@test.it"), "books/book1/recipes/r1")));
  });

  it("il membro legacy 'read' legge come un lettore ma non scrive nulla", async () => {
    await assertSucceeds(getDoc(doc(asUser("legacyread@test.it"), "books/book1")));
    await assertSucceeds(getDoc(doc(asUser("legacyread@test.it"), "books/book1/recipes/r1")));
    await assertFails(setDoc(doc(asUser("legacyread@test.it"), "books/book1/recipes/r2"), { title: "Biscotti", memories: [] }));
    await assertFails(updateDoc(doc(asUser("legacyread@test.it"), "books/book1/recipes/r1"), { title: "Torta modificata" }));
    await assertFails(deleteDoc(doc(asUser("legacyread@test.it"), "books/book1/recipes/r1")));
  });

  it("i valori restano letteralmente 'edit'/'read' nel documento: nessuna riscrittura implicita", async () => {
    const snap = await getDoc(doc(asUser("legacyedit@test.it"), "books/book1"));
    const roles = snap.data().meta.memberRoles;
    expect(roles["legacyedit@test.it"]).toBe("edit");
    expect(roles["legacyread@test.it"]).toBe("read");
  });
});

describe("firestore.rules — books/b1 (Beta) non riceve nulla in più dal blocco generico", () => {
  beforeEach(() =>
    seed(async (db) => {
      await setDoc(doc(db, "allowlist/tester@test.it"), { role: "tester" });
      await setDoc(doc(db, "allowlist/base@test.it"), { role: "base" });
      await setDoc(doc(db, "books/b1"), { meta: baseMeta({ owner: "", memberEmails: [], memberRoles: {} }) });
    })
  );

  it("un tester accede al Beta", async () => {
    await assertSucceeds(getDoc(doc(asUser("tester@test.it"), "books/b1")));
  });

  it("un ruolo base non accede al Beta, anche se meta.owner fosse vuoto", async () => {
    await assertFails(getDoc(doc(asUser("base@test.it"), "books/b1")));
  });
});
