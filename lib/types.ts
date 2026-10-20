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
