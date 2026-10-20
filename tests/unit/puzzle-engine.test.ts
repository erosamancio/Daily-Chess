import { describe, expect, it } from "vitest";
import { PuzzleEngine } from "@/lib/puzzle-engine";

// Brancas jogam Rd8. O primeiro lance (h7h6) é do adversário.
const backRank = {
  fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1",
  moves: ["h7h6", "d1d8"],
};

// Linha com 2 lances do jogador e resposta automática do adversário.
const twoMover = {
  // Brancas: Kg1, Qd1, Rf1; Pretas: Kg8, peões f7 g7 h7, Ra8
  fen: "r5k1/5ppp/8/8/8/8/5PPP/3Q1RK1 b - - 0 1",
  moves: ["a8a1", "d1a1", "h7h6", "a1a8"],
};

describe("PuzzleEngine", () => {
  it("anima o lance do adversário e define a cor do jogador", () => {
    const e = new PuzzleEngine(backRank);
    expect(e.playerColor).toBe("white");
    expect(e.start()).toBe("h7h6");
    expect(e.isPlayerTurn).toBe(true);
    expect(e.totalPlayerMoves).toBe(1);
  });

  it("aceita o lance correto e resolve", () => {
    const e = new PuzzleEngine(backRank);
    e.start();
    expect(e.tryMove("d1", "d8").kind).toBe("solved");
    expect(e.solved).toBe(true);
    expect(e.mistakes).toBe(0);
  });

  it("rejeita lance errado sem alterar a posição", () => {
    const e = new PuzzleEngine(backRank);
    e.start();
    const before = e.fen;
    expect(e.tryMove("d1", "d7").kind).toBe("wrong");
    expect(e.fen).toBe(before);
    expect(e.mistakes).toBe(1);
  });

  it("retorna illegal para lances impossíveis", () => {
    const e = new PuzzleEngine(backRank);
    e.start();
    expect(e.tryMove("d1", "e5").kind).toBe("illegal");
    expect(e.mistakes).toBe(0);
  });

  it("aceita mate alternativo", () => {
    // Duas torres podem dar mate: Rd8# (solução) ou Re8#.
    const e = new PuzzleEngine({
      fen: "6k1/p4ppp/8/8/8/8/5PPP/3RR1K1 b - - 0 1",
      moves: ["a7a6", "d1d8"],
    });
    e.start();
    expect(e.tryMove("e1", "e8").kind).toBe("solved");
  });

  it("responde automaticamente em linhas longas", () => {
    const e = new PuzzleEngine(twoMover);
    e.start();
    const r = e.tryMove("d1", "a1");
    expect(r).toMatchObject({ kind: "correct", uci: "d1a1", reply: "h7h6" });
    expect(e.parseSan("Qa8+")).toEqual({ from: "a1", to: "a8", promotion: undefined });
    expect(e.playerMovesDone).toBe(1);
    expect(e.tryMove("a1", "a8").kind).toBe("solved");
  });

  it("dá dicas em dois níveis e revela a solução", () => {
    const e = new PuzzleEngine(twoMover);
    e.start();
    expect(e.hint(1)).toEqual({ from: "d1" });
    expect(e.hint(2)).toEqual({ from: "d1", to: "a1" });
    expect(e.playNext()?.kind).toBe("correct");
    expect(e.playNext()?.kind).toBe("solved");
  });

  it("trata promoção", () => {
    const e = new PuzzleEngine({
      fen: "7k/P7/8/8/8/8/6p1/K7 b - - 0 1",
      moves: ["h8g8", "a7a8q"],
    });
    e.start();
    expect(e.needsPromotion("a7", "a8")).toBe(true);
    expect(e.tryMove("a7", "a8", "n").kind).toBe("wrong");
    expect(e.tryMove("a7", "a8", "q").kind).toBe("solved");
  });

  it("suporta puzzles sem lance inicial do adversário (clássicos)", () => {
    const e = new PuzzleEngine({ ...backRank, fen: "6k1/5pp1/7p/8/8/8/5PPP/3R2K1 w - - 0 1", moves: ["d1d8"], opponentFirst: false });
    expect(e.start()).toBeNull();
    expect(e.playerColor).toBe("white");
    expect(e.tryMove("d1", "d8").kind).toBe("solved");
  });
});
