import { describe, it, expect } from "vitest";
import { remainingMs, isExpired, formatRemaining, formatOverdue } from "../src/utils/timers.js";

const timerEndingIn = (ms, now) => ({ id: "t1", label: "Test", minutes: ms / 60000, endAt: now + ms, alerted: false });

describe("remainingMs / isExpired", () => {
  it("timer futuro → remainingMs positivo, non scaduto", () => {
    const now = 1_000_000;
    const t = timerEndingIn(60000, now); // scade tra 1 minuto
    expect(remainingMs(t, now)).toBe(60000);
    expect(isExpired(t, now)).toBe(false);
  });

  it("timer scaduto esattamente ora → considerato scaduto", () => {
    const now = 1_000_000;
    const t = { ...timerEndingIn(0, now) };
    expect(isExpired(t, now)).toBe(true);
  });

  it("now salta in avanti (sospensione simulata) → resta corretto", () => {
    const start = 1_000_000;
    const t = timerEndingIn(5 * 60000, start); // 5 minuti
    // Il "browser" resta sospeso 20 minuti: nessun tick intermedio, solo
    // un salto diretto di `now` — esattamente lo scenario che la scadenza
    // assoluta deve gestire correttamente (a differenza di un contatore).
    const later = start + 20 * 60000;
    expect(isExpired(t, later)).toBe(true);
    expect(remainingMs(t, later)).toBe(-15 * 60000); // scaduto da 15 minuti
  });
});

describe("formatRemaining", () => {
  it("sotto il minuto", () => {
    expect(formatRemaining(5000)).toBe("0:05");
  });
  it("minuti e secondi", () => {
    expect(formatRemaining(125000)).toBe("2:05");
  });
  it("oltre l'ora", () => {
    expect(formatRemaining(3661000)).toBe("1:01:01");
  });
  it("negativo (già scaduto) → non va sotto zero", () => {
    expect(formatRemaining(-5000)).toBe("0:00");
  });
});

describe("formatOverdue", () => {
  it("scaduto da pochi secondi", () => {
    expect(formatOverdue(30000)).toBe("scaduto ora");
  });
  it("scaduto da 1 minuto (singolare)", () => {
    expect(formatOverdue(60000)).toBe("scaduto 1 min fa");
  });
  it("scaduto da alcuni minuti (plurale)", () => {
    expect(formatOverdue(4 * 60000)).toBe("scaduto 4 min fa");
  });
  it("scaduto da oltre un'ora", () => {
    expect(formatOverdue(90 * 60000)).toBe("scaduto 1h 30min fa");
  });
  it("scaduto da ore esatte, senza minuti residui", () => {
    expect(formatOverdue(120 * 60000)).toBe("scaduto 2h fa");
  });
});
