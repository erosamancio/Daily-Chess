import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { dayNumber, todayKey } from "./daily";
import type { DailyEntry, DailyLevelsEntry, Puzzle, ThemeKey } from "./types";

const DATA = join(process.cwd(), "data");

let schedule: DailyEntry[] | null = null;
let levelsSchedule: DailyLevelsEntry[] | null = null;
const themeCache = new Map<ThemeKey, Puzzle[]>();

function loadSchedule(): DailyEntry[] {
  schedule ??= JSON.parse(readFileSync(join(DATA, "daily-schedule.json"), "utf8"));
  return schedule!;
}

export function loadTheme(theme: ThemeKey): Puzzle[] {
  let list = themeCache.get(theme);
  if (!list) {
    list = JSON.parse(readFileSync(join(DATA, "puzzles", `${theme}.json`), "utf8")) as Puzzle[];
    themeCache.set(theme, list);
  }
  return list;
}

export function getDaily(date: string): DailyEntry | null {
  const today = todayKey();
  if (date > today) return null;
  const n = dayNumber(date);
  if (n < 1) return null;
  const all = loadSchedule();
  const entry = all[(n - 1) % all.length];
  return { ...entry, date, number: n };
}

export function getDailyLevels(date: string): { easy: Puzzle; hard: Puzzle } | null {
  if (date > todayKey()) return null;
  const n = dayNumber(date);
  if (n < 1) return null;
  if (!levelsSchedule) {
    const file = join(DATA, "daily-levels.json");
    if (!existsSync(file)) return null;
    levelsSchedule = JSON.parse(readFileSync(file, "utf8")) as DailyLevelsEntry[];
  }
  const { easy, hard } = levelsSchedule[(n - 1) % levelsSchedule.length];
  return { easy, hard };
}

export function getToday(): DailyEntry {
  return getDaily(todayKey())!;
}

export function getTraining(theme: ThemeKey, rating: number, exclude: Set<string>, count: number): Puzzle[] {
  const list = loadTheme(theme);
  const near = list.filter((p) => Math.abs(p.rating - rating) <= 150 && !exclude.has(p.id));
  const pool = near.length >= count ? near : list.filter((p) => !exclude.has(p.id));
  return sample(pool.length ? pool : list, count);
}

export function getRush(count: number): Puzzle[] {
  const themes: ThemeKey[] = [
    "mateIn1",
    "mateIn2",
    "fork",
    "pin",
    "skewer",
    "discoveredAttack",
    "deflection",
    "sacrifice",
    "backRankMate",
    "hangingPiece",
    "attraction",
  ];
  const all = themes.flatMap((t) => loadTheme(t)).filter((p) => p.moves.length <= 6);
  const out: Puzzle[] = [];
  for (let i = 0; i < count; i++) {
    const target = Math.min(2500, 700 + i * 45);
    const band = all.filter((p) => Math.abs(p.rating - target) <= 60);
    out.push(sample(band.length ? band : all, 1)[0]);
  }
  return out;
}

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
