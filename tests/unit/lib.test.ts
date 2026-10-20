import { describe, expect, it } from "vitest";
import { addDays, dateFromNumber, dayNumber, isValidDateKey, todayKey, weekday } from "@/lib/daily";
import { updateRating } from "@/lib/rating";
import { buildShareText, formatTime } from "@/lib/share";
import { computeStreak, type DailyRecord } from "@/lib/streak";

describe("daily", () => {
  it("vira o dia à meia-noite de Brasília, não em UTC", () => {
    // 02:30 UTC de 21/10 = 23:30 de 20/10 em São Paulo (UTC-3)
    expect(todayKey(new Date("2026-10-21T02:30:00Z"))).toBe("2026-10-20");
    expect(todayKey(new Date("2026-10-21T03:00:00Z"))).toBe("2026-10-21");
  });

  it("numera os dias de forma estável", () => {
    expect(dayNumber("2026-10-01")).toBe(1);
    expect(dayNumber("2026-10-20")).toBe(20);
    expect(dateFromNumber(20)).toBe("2026-10-20");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(weekday("2026-10-20")).toBe(2); // terça
  });

  it("valida chaves de data", () => {
    expect(isValidDateKey("2026-10-20")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("abc")).toBe(false);
  });
});

describe("rating", () => {
  it("sobe ao acertar e desce ao errar", () => {
    expect(updateRating(1200, 1200, true, 50)).toBe(1208);
    expect(updateRating(1200, 1200, false, 50)).toBe(1192);
    expect(updateRating(1200, 1200, true, 0)).toBe(1230);
  });
});

describe("share", () => {
  it("monta o texto estilo Wordle", () => {
    const text = buildShareText({
      number: 42,
      marks: ["clean", "struggle", "clean"],
      timeMs: 38_000,
      streak: 5,
      solved: true,
      url: "dailychess.app",
    });
    expect(text).toBe("Daily Chess #42 ♟️ ✅\n🟩🟨🟩\n⏱ 0:38 · 🔥 5\ndailychess.app");
    expect(formatTime(125_400)).toBe("2:05");
  });
});

describe("streak", () => {
  const rec = (status: DailyRecord["status"]): DailyRecord => ({ status, mistakes: 0, hints: 0, timeMs: 0, marks: [] });

  it("conta dias consecutivos e não quebra antes do dia acabar", () => {
    const records = {
      "2026-10-15": rec("solved"),
      "2026-10-16": rec("solved"),
      "2026-10-17": rec("solved"),
      "2026-10-18": rec("failed"),
      "2026-10-19": rec("solved"),
    };
    expect(computeStreak(records, "2026-10-20")).toEqual({ current: 1, best: 3 });
    expect(computeStreak({ ...records, "2026-10-20": rec("solved") }, "2026-10-20")).toEqual({ current: 2, best: 3 });
    expect(computeStreak(records, "2026-10-22").current).toBe(0);
  });
});
