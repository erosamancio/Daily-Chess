/**
 * Versão 2: gera os temas novos de treino e os níveis fácil e difícil do desafio diário,
 * sem mexer nos arquivos que já existem (o calendário original continua igual, então
 * os dias já jogados não mudam).
 *
 * Uso: npm run build:extra -- <caminho/lichess_db_puzzle.csv.zst>
 * Requer o binário `zstd` no PATH.
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Chess } from "chess.js";
import { addDays, LAUNCH_DATE } from "../lib/daily";
import { parseUci } from "../lib/puzzle-engine";
import { THEMES, type DailyEntry, type DailyLevelsEntry, type Puzzle, type ThemeKey } from "../lib/types";

const SOURCE = process.argv[2];
if (!SOURCE) {
  console.error("Informe o caminho do lichess_db_puzzle.csv.zst");
  process.exit(1);
}

const DATA = join(import.meta.dirname, "..", "data");
const SCHEDULE_DAYS = 730;

const ORIGINAL: ThemeKey[] = [
  "mateIn1",
  "mateIn2",
  "mateIn3",
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "sacrifice",
  "deflection",
  "endgame",
  "advantage",
];
const NEW_THEMES = THEMES.filter((t) => !ORIGINAL.includes(t));

const BAND_MIN = 600;
const BAND_MAX = 2600;
const BAND_SIZE = 100;
const PER_BAND = 25;

// Níveis do diário: fácil é curto e acessível; difícil é para quem já joga bem.
const LEVELS = {
  easy: { min: 700, max: 1100, maxMoves: 6, popularity: 92, plays: 2000 },
  hard: { min: 2100, max: 2600, maxMoves: 10, popularity: 90, plays: 1000 },
} as const;
const LEVEL_PER_THEME = 160;

// O primeiro tema que bater vira o tema principal (define o objetivo mostrado: "mate em N" ou "melhor lance").
const PRIORITY: ThemeKey[] = ["mateIn1", "mateIn2", "mateIn3", "smotheredMate", "backRankMate", ...NEW_THEMES, ...ORIGINAL.slice(3)];

function primaryTheme(tags: string[], moveCount: number): ThemeKey | null {
  for (const t of PRIORITY) {
    if (t === "advantage") {
      if ((tags.includes("advantage") || tags.includes("crushing")) && moveCount >= 4) return t;
    } else if (tags.includes(t)) return t;
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

// Nada do que já existe pode reaparecer: nem o calendário original, nem o treino.
const used = new Set<string>();
const schedule: DailyEntry[] = JSON.parse(readFileSync(join(DATA, "daily-schedule.json"), "utf8"));
schedule.forEach((d) => used.add(d.puzzle.id));
for (const t of ORIGINAL) {
  const list: Puzzle[] = JSON.parse(readFileSync(join(DATA, "puzzles", `${t}.json`), "utf8"));
  list.forEach((p) => used.add(p.id));
}

const training = new Map<ThemeKey, Map<number, Puzzle[]>>(NEW_THEMES.map((t) => [t, new Map()]));
const levelPool = {
  easy: new Map<ThemeKey, Puzzle[]>(),
  hard: new Map<ThemeKey, Puzzle[]>(),
};

let lines = 0;
const zstd = spawn("zstd", ["-dc", SOURCE]);
const rl = createInterface({ input: zstd.stdout, crlfDelay: Infinity });

for await (const line of rl) {
  if (lines++ === 0) continue;
  if (lines % 1_000_000 === 0) console.log(`${lines.toLocaleString()} linhas lidas`);
  const [id, fen, movesStr, ratingStr, rdStr, popStr, playsStr, themesStr, gameUrl] = line.split(",");
  if (used.has(id)) continue;
  const rating = Number(ratingStr);
  const popularity = Number(popStr);
  const plays = Number(playsStr);
  if (popularity < 85 || plays < 500 || Number(rdStr) > 90) continue;

  const moves = movesStr.split(" ");
  const tags = themesStr.split(" ");
  const known = tags.filter((t) => (THEMES as readonly string[]).includes(t));

  // Níveis do diário.
  const level = (Object.keys(LEVELS) as (keyof typeof LEVELS)[]).find((k) => {
    const c = LEVELS[k];
    return rating >= c.min && rating < c.max && moves.length <= c.maxMoves && popularity >= c.popularity && plays >= c.plays;
  });
  if (level) {
    const theme = primaryTheme(tags, moves.length);
    const pool = theme && levelPool[level];
    if (theme && pool) {
      const list = pool.get(theme) ?? [];
      if (list.length < LEVEL_PER_THEME && isValid(fen, moves)) {
        list.push({ id, fen, moves, rating, theme, themes: known, gameUrl });
        pool.set(theme, list);
        used.add(id);
        continue;
      }
    }
  }

  // Temas novos de treino.
  if (rating < BAND_MIN || rating >= BAND_MAX) continue;
  const band = Math.floor(rating / BAND_SIZE) * BAND_SIZE;
  const theme = NEW_THEMES.find((t) => tags.includes(t) && (training.get(t)!.get(band)?.length ?? 0) < PER_BAND);
  if (!theme || !isValid(fen, moves)) continue;
  const bands = training.get(theme)!;
  bands.set(band, [...(bands.get(band) ?? []), { id, fen, moves, rating, theme, themes: known, gameUrl }]);
  used.add(id);
}

for (const [theme, bands] of training) {
  const list = [...bands.values()].flat().sort((a, b) => a.rating - b.rating);
  writeFileSync(join(DATA, "puzzles", `${theme}.json`), JSON.stringify(list));
  console.log(`${theme}: ${list.length} puzzles`);
}

/** Alterna os temas para os dias não ficarem repetitivos. */
function rotate(pool: Map<ThemeKey, Puzzle[]>): Puzzle[] {
  const queues = [...pool.values()].map((l) => [...l].sort(() => Math.random() - 0.5));
  const out: Puzzle[] = [];
  while (out.length < SCHEDULE_DAYS && queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
  if (out.length < SCHEDULE_DAYS) throw new Error(`Só ${out.length} puzzles para um nível`);
  return out.slice(0, SCHEDULE_DAYS);
}

const easy = rotate(levelPool.easy);
const hard = rotate(levelPool.hard);
const levels: DailyLevelsEntry[] = Array.from({ length: SCHEDULE_DAYS }, (_, i) => ({
  date: addDays(LAUNCH_DATE, i),
  easy: easy[i],
  hard: hard[i],
}));
writeFileSync(join(DATA, "daily-levels.json"), JSON.stringify(levels));
console.log(`daily-levels: ${levels.length} dias (fácil e difícil)`);
