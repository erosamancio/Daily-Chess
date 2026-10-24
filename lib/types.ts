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
  // Versão 2
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

/**
 * Formato Lichess: `fen` é a posição ANTES do lance do adversário.
 * `moves[0]` é o lance do adversário; o usuário joga os índices ímpares.
 */
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
  /** Posição com o jogador que resolve já na vez (sem lance do adversário inicial). */
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

/** Níveis do diário. O "normal" é o calendário original (`DailyEntry`), que conta a sequência. */
export const DAILY_LEVELS = ["easy", "normal", "hard"] as const;
export type DailyLevel = (typeof DAILY_LEVELS)[number];
export type DailyLevelsEntry = { date: string; easy: Puzzle; hard: Puzzle };
