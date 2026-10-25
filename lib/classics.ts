import { Chess } from "chess.js";
import { CLASSICS, type ClassicSource } from "@/data/classics.source";

export type Classic = Omit<ClassicSource, "pgn" | "solution"> & {
  fen: string;
  moves: string[];
  history: string[];
  mate: boolean;
};

function toClassic(src: ClassicSource): Classic {
  const chess = new Chess();
  const history = src.pgn.split(/\s+/);
  for (const san of history) chess.move(san);
  const fen = chess.fen();
  const moves = src.solution.split(/\s+/).map((san) => {
    const m = chess.move(san);
    return m.from + m.to + (m.promotion ?? "");
  });
  const { slug, year, white, black, event, difficulty, title, story } = src;
  return { slug, year, white, black, event, difficulty, title, story, fen, moves, history, mate: chess.isCheckmate() };
}

let cache: Classic[] | null = null;

export function getClassics(): Classic[] {
  cache ??= CLASSICS.map(toClassic);
  return cache;
}

export function getClassic(slug: string): Classic | undefined {
  return getClassics().find((c) => c.slug === slug);
}
