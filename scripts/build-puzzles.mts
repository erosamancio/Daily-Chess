import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Chess } from "chess.js";
import { addDays, LAUNCH_DATE, weekday, WEEKDAY_RATING } from "../lib/daily";
import { parseUci } from "../lib/puzzle-engine";
import { THEMES, type DailyEntry, type Puzzle, type ThemeKey } from "../lib/types";

const SOURCE = process.argv[2];
if (!SOURCE) {
  console.error("Informe o caminho do lichess_db_puzzle.csv.zst");
  process.exit(1);
}

const OUT_DIR = join(import.meta.dirname, "..", "data");
const SCHEDULE_DAYS = 730;

const BAND_MIN = 600;
const BAND_MAX = 2600;
const BAND_SIZE = 100;
const PER_BAND = 25;

const PRIORITY: ThemeKey[] = [
  "mateIn1",
  "mateIn2",
  "mateIn3",
  "fork",
  "skewer",
  "pin",
  "discoveredAttack",
  "deflection",
  "sacrifice",
  "endgame",
  "advantage",
];

const DAILY_ROTATION: ThemeKey[] = [
  "mateIn2",
  "fork",
  "pin",
  "mateIn1",
  "discoveredAttack",
  "sacrifice",
  "skewer",
  "mateIn3",
  "deflection",
  "endgame",
  "advantage",
];

function primaryTheme(tags: string[], moveCount: number): ThemeKey | null {
  for (const t of PRIORITY) {
    if (t === "advantage") {
      if ((tags.includes("advantage") || tags.includes("crushing")) && moveCount >= 4) return t;
    } else if (tags.includes(t)) {
      return t;
    }
  }
  return null;
}

function isValid(fen: string, moves: string[]): boolean {
  try {
    const chess = new Chess(fen);
    for (const uci of moves) chess.move(parseUci(uci));
    return true;
  } catch {
    return false;
  }
}

const training = new Map<ThemeKey, Map<number, Puzzle[]>>();
for (const t of THEMES) training.set(t, new Map());

const dailyBands = Object.entries(WEEKDAY_RATING).map(([wd, range]) => ({ wd: Number(wd), range }));
const dailyPool = new Map<number, Map<ThemeKey, Puzzle[]>>();
for (const { wd } of dailyBands) dailyPool.set(wd, new Map(THEMES.map((t) => [t, []])));
const DAILY_PER_CELL = 40;

let lines = 0;
let kept = 0;

const zstd = spawn("zstd", ["-dc", SOURCE]);
const rl = createInterface({ input: zstd.stdout, crlfDelay: Infinity });

for await (const line of rl) {
  if (lines++ === 0) continue;
  const [id, fen, movesStr, ratingStr, rdStr, popStr, playsStr, themesStr, gameUrl] = line.split(",");
  const rating = Number(ratingStr);
  const rd = Number(rdStr);
  const popularity = Number(popStr);
  const plays = Number(playsStr);
  if (popularity < 85 || plays < 500 || rd > 90) continue;

  const moves = movesStr.split(" ");
  const tags = themesStr.split(" ");
  const theme = primaryTheme(tags, moves.length);
  if (!theme) continue;

  const puzzle: Puzzle = {
    id,
    fen,
    moves,
    rating,
    theme,
    themes: tags.filter((t) => (THEMES as readonly string[]).includes(t)),
    gameUrl,
  };

  if (popularity >= 92 && plays >= 2000 && moves.length <= 8) {
    const cell = dailyBands
      .filter(({ range }) => rating >= range[0] && rating < range[1])
      .map(({ wd }) => dailyPool.get(wd)!.get(theme)!)
      .find((c) => c.length < DAILY_PER_CELL);
    if (cell && isValid(fen, moves)) {
      cell.push(puzzle);
      continue;
    }
  }

  if (rating < BAND_MIN || rating >= BAND_MAX) continue;
  const band = Math.floor(rating / BAND_SIZE) * BAND_SIZE;
  const bands = training.get(theme)!;
  const list = bands.get(band) ?? [];
  if (list.length >= PER_BAND) continue;
  if (!isValid(fen, moves)) continue;
  list.push(puzzle);
  bands.set(band, list);
  kept++;

  if (lines % 500_000 === 0) console.log(`${lines.toLocaleString()} linhas lidas, ${kept} no treino`);
}

mkdirSync(join(OUT_DIR, "puzzles"), { recursive: true });
for (const [theme, bands] of training) {
  const list = [...bands.values()].flat().sort((a, b) => a.rating - b.rating);
  writeFileSync(join(OUT_DIR, "puzzles", `${theme}.json`), JSON.stringify(list));
  console.log(`${theme}: ${list.length} puzzles`);
}

const schedule: DailyEntry[] = [];
let rotation = 0;
for (let i = 0; i < SCHEDULE_DAYS; i++) {
  const date = addDays(LAUNCH_DATE, i);
  const cells = dailyPool.get(weekday(date))!;
  let puzzle: Puzzle | undefined;
  for (let tries = 0; tries < DAILY_ROTATION.length && !puzzle; tries++) {
    const theme = DAILY_ROTATION[(rotation + tries) % DAILY_ROTATION.length];
    puzzle = cells.get(theme)!.shift();
  }
  rotation++;
  if (!puzzle) throw new Error(`Sem puzzles para ${date}`);
  schedule.push({ date, number: i + 1, puzzle });
}
writeFileSync(join(OUT_DIR, "daily-schedule.json"), JSON.stringify(schedule));
console.log(`daily-schedule: ${schedule.length} dias a partir de ${LAUNCH_DATE}`);
