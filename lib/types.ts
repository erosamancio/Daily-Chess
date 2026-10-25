export const THEMES = [
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
  "backRankMate",
  "smotheredMate",
  "hangingPiece",
  "promotion",
  "attraction",
  "interference",
  "quietMove",
  "zugzwang",
] as const;

export type ThemeKey = (typeof THEMES)[number];

export function isTheme(value: string): value is ThemeKey {
  return (THEMES as readonly string[]).includes(value);
}

export type Puzzle = {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  theme: ThemeKey;
  themes: string[];
  gameUrl?: string;
};

export type Classic = {
  slug: string;
  fen: string;
  moves: string[];
  year: number;
  white: string;
  black: string;
  event: string;
  title: { pt: string; en: string };
  story: { pt: string; en: string };
};

export type DailyEntry = { date: string; number: number; puzzle: Puzzle };

export const DAILY_LEVELS = ["easy", "normal", "hard"] as const;
export type DailyLevel = (typeof DAILY_LEVELS)[number];
export type DailyLevelsEntry = { date: string; easy: Puzzle; hard: Puzzle };
