import { Chess, type Square } from "chess.js";

export type PuzzleInput = {
  fen: string;
  moves: string[];
  opponentFirst?: boolean;
};

export type MoveResult =
  | { kind: "illegal" }
  | { kind: "wrong"; uci: string }
  | { kind: "correct"; uci: string; reply: string; fenAfterMove: string }
  | { kind: "solved"; uci: string };

export type Hint = { from: Square; to?: Square };

export function parseUci(uci: string) {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

export class PuzzleEngine {
  private chess: Chess;
  private readonly moves: string[];
  private readonly opponentFirst: boolean;
  private readonly startFen: string;
  ply = 0;
  mistakes = 0;
  solved = false;
  lastMove: { from: Square; to: Square } | null = null;

  constructor(input: PuzzleInput) {
    this.startFen = input.fen;
    this.moves = input.moves;
    this.opponentFirst = input.opponentFirst ?? true;
    this.chess = new Chess(input.fen);
  }

  start(): string | null {
    if (!this.opponentFirst || this.ply > 0) return null;
    const uci = this.moves[0];
    this.apply(uci);
    this.ply = 1;
    return uci;
  }

  get fen() {
    return this.chess.fen();
  }

  get initialFen() {
    return this.startFen;
  }

  toSan(uci: string, fen = this.chess.fen()): string {
    try {
      return new Chess(fen).move(parseUci(uci)).san;
    } catch {
      return uci;
    }
  }

  parseSan(san: string): { from: Square; to: Square; promotion?: string } | null {
    try {
      const m = new Chess(this.chess.fen()).move(san.trim());
      return { from: m.from, to: m.to, promotion: m.promotion };
    } catch {
      return null;
    }
  }

  get playerColor(): "white" | "black" {
    const first = new Chess(this.startFen).turn();
    const player = this.opponentFirst ? (first === "w" ? "b" : "w") : first;
    return player === "w" ? "white" : "black";
  }

  get isPlayerTurn() {
    return !this.solved && this.chess.turn() === this.playerColor[0];
  }

  get totalPlayerMoves() {
    return Math.ceil((this.moves.length - (this.opponentFirst ? 1 : 0)) / 2);
  }

  get playerMovesDone() {
    return Math.ceil((this.ply - (this.opponentFirst ? 1 : 0)) / 2);
  }

  get expected(): string | undefined {
    return this.moves[this.ply];
  }

  legalTargets(from: Square): Square[] {
    return this.chess.moves({ square: from, verbose: true }).map((m) => m.to);
  }

  needsPromotion(from: Square, to: Square): boolean {
    return this.chess
      .moves({ square: from, verbose: true })
      .some((m) => m.to === to && !!m.promotion);
  }

  pieceAt(square: Square) {
    return this.chess.get(square) ?? null;
  }

  tryMove(from: Square, to: Square, promotion?: string): MoveResult {
    if (!this.isPlayerTurn) return { kind: "illegal" };
    const probe = new Chess(this.chess.fen());
    let move;
    try {
      move = probe.move({ from, to, promotion: promotion ?? "q" });
    } catch {
      return { kind: "illegal" };
    }
    const uci = move.from + move.to + (move.promotion ?? "");
    const expected = this.expected!;

    const isAltMate = uci !== expected && probe.isCheckmate();
    if (uci !== expected && !isAltMate) {
      this.mistakes++;
      return { kind: "wrong", uci };
    }

    this.apply(uci);
    this.ply++;
    if (isAltMate || this.ply >= this.moves.length) {
      this.solved = true;
      return { kind: "solved", uci };
    }
    const fenAfterMove = this.chess.fen();
    const reply = this.moves[this.ply];
    this.apply(reply);
    this.ply++;
    return { kind: "correct", uci, reply, fenAfterMove };
  }

  hint(level: 1 | 2): Hint | null {
    if (!this.isPlayerTurn || !this.expected) return null;
    const { from, to } = parseUci(this.expected);
    return level === 1 ? { from } : { from, to };
  }

  playNext(): MoveResult | null {
    if (!this.isPlayerTurn || !this.expected) return null;
    const { from, to, promotion } = parseUci(this.expected);
    return this.tryMove(from, to, promotion);
  }

  private apply(uci: string) {
    const { from, to, promotion } = parseUci(uci);
    this.chess.move({ from, to, promotion });
    this.lastMove = { from, to };
  }
}

export function validateLine(fen: string, moves: string[]): boolean {
  const chess = new Chess(fen);
  for (const uci of moves) {
    const { from, to, promotion } = parseUci(uci);
    chess.move({ from, to, promotion });
  }
  return true;
}
