import { describe, it, expect } from "vitest";
import {
  normalizeRole, isEditorRole, canDelete, canAddMember,
  assignableRoles, canAssignRole, canRemoveMember, MAX_MEMBERS,
} from "../src/utils/bookRoles.js";

describe("normalizeRole — alias legacy", () => {
  it("mappa edit → redattore, read → lettore", () => {
    expect(normalizeRole("edit")).toBe("redattore");
    expect(normalizeRole("read")).toBe("lettore");
  });
  it("lascia invariati i ruoli già nuovi", () => {
    expect(normalizeRole("collaboratore")).toBe("collaboratore");
    expect(normalizeRole("redattore")).toBe("redattore");
  });
});

describe("isEditorRole", () => {
  it("proprietario, collaboratore, redattore possono scrivere contenuti", () => {
    expect(isEditorRole("proprietario")).toBe(true);
    expect(isEditorRole("collaboratore")).toBe(true);
    expect(isEditorRole("redattore")).toBe(true);
    expect(isEditorRole("edit")).toBe(true); // alias legacy
  });
  it("il lettore non può scrivere contenuti", () => {
    expect(isEditorRole("lettore")).toBe(false);
    expect(isEditorRole("read")).toBe(false); // alias legacy
  });
});

describe("canDelete — eliminazione ricette/ricordi", () => {
  it("solo proprietario e collaboratore", () => {
    expect(canDelete("proprietario")).toBe(true);
    expect(canDelete("collaboratore")).toBe(true);
  });
  it("mai redattore o lettore", () => {
    expect(canDelete("redattore")).toBe(false);
    expect(canDelete("edit")).toBe(false); // alias legacy: redattore, non collaboratore
    expect(canDelete("lettore")).toBe(false);
  });
});

describe("canAddMember — tetto 20 membri (proprietario incluso)", () => {
  it("permette fino al 19° membro (20 totali con il proprietario)", () => {
    expect(canAddMember(18)).toBe(true); // diventerebbero 19 membri + owner = 20
  });
  it("blocca oltre il tetto", () => {
    expect(canAddMember(19)).toBe(false); // già 19 membri + owner = 20
    expect(canAddMember(25)).toBe(false);
  });
  it("MAX_MEMBERS è 20", () => {
    expect(MAX_MEMBERS).toBe(20);
  });
});

describe("assignableRoles", () => {
  it("il proprietario può assegnare tutti e tre i ruoli non-owner", () => {
    expect(assignableRoles("proprietario")).toEqual(["collaboratore", "redattore", "lettore"]);
  });
  it("il collaboratore può assegnare solo redattore/lettore", () => {
    expect(assignableRoles("collaboratore")).toEqual(["redattore", "lettore"]);
  });
  it("redattore e lettore non assegnano nulla", () => {
    expect(assignableRoles("redattore")).toEqual([]);
    expect(assignableRoles("lettore")).toEqual([]);
  });
});

describe("canAssignRole — la matrice completa", () => {
  it("il proprietario invita/promuove a qualunque ruolo tranne proprietario", () => {
    expect(canAssignRole("proprietario", null, "collaboratore")).toBe(true);
    expect(canAssignRole("proprietario", null, "redattore")).toBe(true);
    expect(canAssignRole("proprietario", null, "lettore")).toBe(true);
    expect(canAssignRole("proprietario", "redattore", "lettore")).toBe(true);
    expect(canAssignRole("proprietario", null, "proprietario")).toBe(false);
  });

  it("il collaboratore invita solo come redattore o lettore, mai come collaboratore", () => {
    expect(canAssignRole("collaboratore", null, "redattore")).toBe(true);
    expect(canAssignRole("collaboratore", null, "lettore")).toBe(true);
    expect(canAssignRole("collaboratore", null, "collaboratore")).toBe(false);
  });

  it("il collaboratore promuove/declassa liberamente tra redattore e lettore", () => {
    expect(canAssignRole("collaboratore", "lettore", "redattore")).toBe(true);
    expect(canAssignRole("collaboratore", "redattore", "lettore")).toBe(true);
  });

  it("il collaboratore non tocca mai un altro collaboratore, in nessuna direzione", () => {
    expect(canAssignRole("collaboratore", "collaboratore", "redattore")).toBe(false);
    expect(canAssignRole("collaboratore", "collaboratore", "lettore")).toBe(false);
    expect(canAssignRole("collaboratore", "redattore", "collaboratore")).toBe(false);
  });

  it("il collaboratore non tocca mai il proprietario", () => {
    expect(canAssignRole("collaboratore", "proprietario", "redattore")).toBe(false);
    expect(canAssignRole("collaboratore", "redattore", "proprietario")).toBe(false);
  });

  it("nessuno può auto-promuoversi", () => {
    const emails = { actorEmail: "a@x.it", targetEmail: "a@x.it" };
    expect(canAssignRole("collaboratore", "redattore", "collaboratore", emails)).toBe(false);
    expect(canAssignRole("collaboratore", "lettore", "redattore", emails)).toBe(false);
    expect(canAssignRole("proprietario", "redattore", "collaboratore", emails)).toBe(false);
  });

  it("redattore e lettore non possono mai assegnare ruoli", () => {
    expect(canAssignRole("redattore", "lettore", "redattore")).toBe(false);
    expect(canAssignRole("lettore", "redattore", "lettore")).toBe(false);
  });
});

describe("canRemoveMember", () => {
  it("il proprietario rimuove chiunque", () => {
    expect(canRemoveMember("proprietario", "collaboratore")).toBe(true);
    expect(canRemoveMember("proprietario", "redattore")).toBe(true);
    expect(canRemoveMember("proprietario", "lettore")).toBe(true);
  });
  it("il collaboratore rimuove solo redattori e lettori", () => {
    expect(canRemoveMember("collaboratore", "redattore")).toBe(true);
    expect(canRemoveMember("collaboratore", "lettore")).toBe(true);
    expect(canRemoveMember("collaboratore", "collaboratore")).toBe(false);
  });
  it("redattore e lettore non rimuovono nessuno", () => {
    expect(canRemoveMember("redattore", "lettore")).toBe(false);
    expect(canRemoveMember("lettore", "redattore")).toBe(false);
  });
  it("nessuno può auto-rimuoversi tramite questa funzione", () => {
    const emails = { actorEmail: "a@x.it", targetEmail: "a@x.it" };
    expect(canRemoveMember("proprietario", "collaboratore", emails)).toBe(false);
    expect(canRemoveMember("collaboratore", "redattore", emails)).toBe(false);
  });
});
