export const INITIAL_RATING = 1200;

export function expectedScore(userRating: number, puzzleRating: number) {
  return 1 / (1 + 10 ** ((puzzleRating - userRating) / 400));
}

/** Elo simplificado com K adaptativo: muda rápido nas primeiras partidas. */
export function updateRating(
  userRating: number,
  puzzleRating: number,
  success: boolean,
  gamesPlayed: number,
): number {
  const k = gamesPlayed < 10 ? 60 : gamesPlayed < 30 ? 32 : 16;
  const next = userRating + k * ((success ? 1 : 0) - expectedScore(userRating, puzzleRating));
  return Math.max(400, Math.min(3000, Math.round(next)));
}
