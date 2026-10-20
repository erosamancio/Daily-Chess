import { Chess, type Square } from "chess.js";

export type PuzzleInput = {
  fen: string;
  moves: string[];
  /** true quando moves[0] é um lance do adversário a ser animado (formato Lichess). */
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

/**
 * Motor de um puzzle: lógica pura, sem React.
 * Lances em UCI (e2e4, e7e8q). O usuário joga os lances em posições de "vez do jogador";
 * o motor responde automaticamente com o lance seguinte da solução.
 */
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

  /** Aplica o lance inicial do adversário (se houver). Retorna o lance aplicado. */
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

  /** SAN de um lance UCI na posição atual (para anúncios de acessibilidade). */
  toSan(uci: string, fen = this.chess.fen()): string {
    try {
      return new Chess(fen).move(parseUci(uci)).san;
    } catch {
      return uci;
    }
  }

  /** Converte SAN digitado (ex.: "Nf3") em casas de origem/destino, se legal. */
  parseSan(san: string): { from: Square; to: Square; promotion?: string } | null {
    try {
      const m = new Chess(this.chess.fen()).move(san.trim());
      return { from: m.from, to: m.to, promotion: m.promotion };
    } catch {
      return null;
    }
  }

  /** Cor de quem resolve o puzzle. */
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

  /** Lista de destinos legais a partir de uma casa (para destacar no tabuleiro). */
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

    // Qualquer mate é aceito, mesmo que diferente da solução (mesma regra do Lichess).
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

  /** Joga o próximo lance correto (e a resposta). Usado em "ver solução". */
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

/** Reproduz uma linha inteira; lança erro se algum lance for ilegal. */
export function validateLine(fen: string, moves: string[]): boolean {
  const chess = new Chess(fen);
  for (const uci of moves) {
    const { from, to, promotion } = parseUci(uci);
    chess.move({ from, to, promotion });
  }
  return true;
}
