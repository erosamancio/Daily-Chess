import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { CLASSICS } from "@/data/classics.source";
import { getClassics } from "@/lib/classics";
import { parseUci } from "@/lib/puzzle-engine";
import { THEMES, type DailyEntry, type Puzzle } from "@/lib/types";

const DATA = join(__dirname, "..", "..", "data");

function playLine(fen: string, moves: string[]) {
  const chess = new Chess(fen);
  for (const uci of moves) chess.move(parseUci(uci));
  return chess;
}

describe("clássicos", () => {
  for (const c of getClassics()) {
    it(`${c.slug}: linha legal e termina com lance do jogador`, () => {
      const end = playLine(c.fen, c.moves);
      expect(c.moves.length % 2).toBe(1);
      expect(end.isCheckmate()).toBe(c.mate);
      // A notação de origem marca mate com "#"; ela precisa bater com o tabuleiro.
      const src = CLASSICS.find((x) => x.slug === c.slug)!;
      expect(src.solution.endsWith("#")).toBe(c.mate);
    });
  }
});

const hasData = existsSync(join(DATA, "daily-schedule.json"));

describe.runIf(hasData)("puzzles gerados", () => {
  for (const theme of THEMES) {
    it(`treino ${theme}: todos os puzzles são legais`, { timeout: 30_000 }, () => {
      const list: Puzzle[] = JSON.parse(readFileSync(join(DATA, "puzzles", `${theme}.json`), "utf8"));
      expect(list.length).toBeGreaterThan(50);
      for (const p of list) {
        expect(p.theme).toBe(theme);
        playLine(p.fen, p.moves);
      }
    });
  }

  it("calendário diário sem repetições, legal e contínuo", { timeout: 30_000 }, () => {
    const schedule: DailyEntry[] = JSON.parse(readFileSync(join(DATA, "daily-schedule.json"), "utf8"));
    const ids = new Set(schedule.map((d) => d.puzzle.id));
    expect(ids.size).toBe(schedule.length);
    schedule.forEach((d, i) => {
      expect(d.number).toBe(i + 1);
      const end = playLine(d.puzzle.fen, d.puzzle.moves);
      if (d.puzzle.theme.startsWith("mateIn")) expect(end.isCheckmate()).toBe(true);
    });
  });

  it("puzzles do diário não aparecem no treino", () => {
    const schedule: DailyEntry[] = JSON.parse(readFileSync(join(DATA, "daily-schedule.json"), "utf8"));
    const dailyIds = new Set(schedule.map((d) => d.puzzle.id));
    for (const theme of THEMES) {
      const list: Puzzle[] = JSON.parse(readFileSync(join(DATA, "puzzles", `${theme}.json`), "utf8"));
      for (const p of list) expect(dailyIds.has(p.id)).toBe(false);
    }
  });
});
