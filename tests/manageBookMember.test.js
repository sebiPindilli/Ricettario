// Verifica che applyMemberAction sia collegata correttamente a Firestore
// (letture/scritture reali contro l'emulator via Admin SDK) — la matrice
// di permessi in sé è già coperta a fondo da bookRoles.test.js, qui si
// controlla il "filo" tra quella logica e i documenti veri.
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "ricettario-manage-member-test";

import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { initializeApp, deleteApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { applyMemberAction } from "../src/services/manageBookMemberCore.js";

let app, db;
const PROJECT_ID = "ricettario-manage-member-test";

beforeAll(() => {
  app = getApps()[0] || initializeApp({ projectId: PROJECT_ID });
  db = getFirestore(app);
});

afterAll(async () => {
  await deleteApp(app);
});

// L'emulator non offre un "clear" via Admin SDK — si cancella tutto tramite
// la sua REST API prima di ogni test, così ognuno parte da zero.
beforeEach(async () => {
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: "DELETE" });
});

const seedBook = async (bookId, meta) => db.doc(`books/${bookId}`).set({ meta });
const seedAllowlist = async (email) => db.doc(`allowlist/${email}`).set({ role: "base" });

const baseMeta = (overrides = {}) => ({
  name: "Libro di prova", type: "condiviso", owner: "owner@test.it", bookTheme: "classic",
  memberEmails: [], memberRoles: {},
  ...overrides,
});

describe("applyMemberAction — invite", () => {
  it("il proprietario invita un'email abilitata come redattore", async () => {
    await seedBook("b1", baseMeta());
    await seedAllowlist("nuovo@test.it");
    const res = await applyMemberAction(db, { callerEmail: "owner@test.it", bookId: "b1", action: "invite", targetEmail: "nuovo@test.it", newRole: "redattore" });
    expect(res.status).toBe(200);
    const meta = (await db.doc("books/b1").get()).data().meta;
    expect(meta.memberEmails).toContain("nuovo@test.it");
    expect(meta.memberRoles["nuovo@test.it"]).toBe("redattore");
  });

  it("il collaboratore non può invitare come collaboratore", async () => {
    await seedBook("b1", baseMeta({ memberEmails: ["collab@test.it"], memberRoles: { "collab@test.it": "collaboratore" } }));
    await seedAllowlist("nuovo@test.it");
    const res = await applyMemberAction(db, { callerEmail: "collab@test.it", bookId: "b1", action: "invite", targetEmail: "nuovo@test.it", newRole: "collaboratore" });
    expect(res.status).toBe(403);
  });

  it("un redattore non può invitare nessuno", async () => {
    await seedBook("b1", baseMeta({ memberEmails: ["red@test.it"], memberRoles: { "red@test.it": "redattore" } }));
    await seedAllowlist("nuovo@test.it");
    const res = await applyMemberAction(db, { callerEmail: "red@test.it", bookId: "b1", action: "invite", targetEmail: "nuovo@test.it", newRole: "lettore" });
    expect(res.status).toBe(403);
  });

  it("blocca l'invito di un'email non ancora abilitata in whitelist", async () => {
    await seedBook("b1", baseMeta());
    const res = await applyMemberAction(db, { callerEmail: "owner@test.it", bookId: "b1", action: "invite", targetEmail: "sconosciuto@test.it", newRole: "lettore" });
    expect(res.status).toBe(400);
  });

  it("blocca l'invito oltre il tetto di 20 membri", async () => {
    const memberEmails = Array.from({ length: 19 }, (_, i) => `m${i}@test.it`);
    const memberRoles = Object.fromEntries(memberEmails.map((e) => [e, "lettore"]));
    await seedBook("b1", baseMeta({ memberEmails, memberRoles }));
    await seedAllowlist("nuovo@test.it");
    const res = await applyMemberAction(db, { callerEmail: "owner@test.it", bookId: "b1", action: "invite", targetEmail: "nuovo@test.it", newRole: "lettore" });
    expect(res.status).toBe(400);
  });
});

describe("applyMemberAction — changeRole", () => {
  it("il collaboratore promuove un lettore a redattore", async () => {
    await seedBook("b1", baseMeta({ memberEmails: ["collab@test.it", "x@test.it"], memberRoles: { "collab@test.it": "collaboratore", "x@test.it": "lettore" } }));
    const res = await applyMemberAction(db, { callerEmail: "collab@test.it", bookId: "b1", action: "changeRole", targetEmail: "x@test.it", newRole: "redattore" });
    expect(res.status).toBe(200);
    const meta = (await db.doc("books/b1").get()).data().meta;
    expect(meta.memberRoles["x@test.it"]).toBe("redattore");
  });

  it("il collaboratore non può cambiare il ruolo di un altro collaboratore", async () => {
    await seedBook("b1", baseMeta({ memberEmails: ["collab@test.it", "collab2@test.it"], memberRoles: { "collab@test.it": "collaboratore", "collab2@test.it": "collaboratore" } }));
    const res = await applyMemberAction(db, { callerEmail: "collab@test.it", bookId: "b1", action: "changeRole", targetEmail: "collab2@test.it", newRole: "redattore" });
    expect(res.status).toBe(403);
  });

  it("nessuno può toccare il proprietario, nemmeno per errore di target", async () => {
    await seedBook("b1", baseMeta({ memberEmails: ["collab@test.it"], memberRoles: { "collab@test.it": "collaboratore" } }));
    const res = await applyMemberAction(db, { callerEmail: "collab@test.it", bookId: "b1", action: "changeRole", targetEmail: "owner@test.it", newRole: "redattore" });
    expect(res.status).toBe(403);
    const meta = (await db.doc("books/b1").get()).data().meta;
    expect(meta.owner).toBe("owner@test.it"); // invariato
  });

  it("un collaboratore non può auto-cambiarsi il ruolo", async () => {
    await seedBook("b1", baseMeta({ memberEmails: ["collab@test.it"], memberRoles: { "collab@test.it": "collaboratore" } }));
    const res = await applyMemberAction(db, { callerEmail: "collab@test.it", bookId: "b1", action: "changeRole", targetEmail: "collab@test.it", newRole: "redattore" });
    expect(res.status).toBe(403);
  });
});

describe("applyMemberAction — remove", () => {
  it("il collaboratore rimuove un redattore", async () => {
    await seedBook("b1", baseMeta({ memberEmails: ["collab@test.it", "red@test.it"], memberRoles: { "collab@test.it": "collaboratore", "red@test.it": "redattore" } }));
    const res = await applyMemberAction(db, { callerEmail: "collab@test.it", bookId: "b1", action: "remove", targetEmail: "red@test.it" });
    expect(res.status).toBe(200);
    const meta = (await db.doc("books/b1").get()).data().meta;
    expect(meta.memberEmails).not.toContain("red@test.it");
    expect(meta.memberRoles["red@test.it"]).toBeUndefined();
  });

  it("il collaboratore non può rimuovere un altro collaboratore", async () => {
    await seedBook("b1", baseMeta({ memberEmails: ["collab@test.it", "collab2@test.it"], memberRoles: { "collab@test.it": "collaboratore", "collab2@test.it": "collaboratore" } }));
    const res = await applyMemberAction(db, { callerEmail: "collab@test.it", bookId: "b1", action: "remove", targetEmail: "collab2@test.it" });
    expect(res.status).toBe(403);
  });

  it("un lettore non può rimuovere nessuno (non è né proprietario né collaboratore)", async () => {
    await seedBook("b1", baseMeta({ memberEmails: ["lett@test.it", "red@test.it"], memberRoles: { "lett@test.it": "lettore", "red@test.it": "redattore" } }));
    const res = await applyMemberAction(db, { callerEmail: "lett@test.it", bookId: "b1", action: "remove", targetEmail: "red@test.it" });
    expect(res.status).toBe(403);
  });
});
