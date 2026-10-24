"use client";

import { Chess, type Square } from "chess.js";
import { Lightbulb, Eye, RefreshCw, Keyboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { parseUci, PuzzleEngine, type Hint } from "@/lib/puzzle-engine";
import type { MoveMark } from "@/lib/share";
import { playSound, vibrate } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Board } from "./Board";
import { PromotionPicker } from "./PromotionPicker";

export type PuzzleOutcome = {
  solved: boolean;
  revealed: boolean;
  mistakes: number;
  hints: number;
  timeMs: number;
  marks: MoveMark[];
};

type Props = {
  puzzle: { fen: string; moves: string[]; opponentFirst?: boolean };
  /** Muda quando um novo puzzle deve começar. */
  puzzleKey: string;
  goal: string;
  allowHints?: boolean;
  allowSolution?: boolean;
  /** Rush: o primeiro erro encerra o puzzle. */
  failOnMistake?: boolean;
  onFinish: (outcome: PuzzleOutcome) => void;
};

type Phase = "intro" | "play" | "wait" | "done";
type Feedback = { kind: "good" | "bad" | "solved" | "revealed"; id: number } | null;

function isCapture(fen: string, uci: string) {
  try {
    return !!new Chess(fen).move(parseUci(uci)).captured;
  } catch {
    return false;
  }
}

export const PuzzleBoard = memo(function PuzzleBoard({ puzzle, puzzleKey, goal, allowHints = true, allowSolution = true, failOnMistake, onFinish }: Props) {
  const t = useTranslations("puzzle");
  const ta = useTranslations("a11y");
  const settings = useStore((s) => s.settings);
  const engineRef = useRef<PuzzleEngine | null>(null);
  const timers = useRef<number[]>([]);
  const stats = useRef({ mistakes: 0, hints: 0, struggle: false, revealed: false, marks: [] as MoveMark[], start: 0, finished: false });

  const [fen, setFen] = useState(puzzle.fen);
  const [phase, setPhase] = useState<Phase>("intro");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [flash, setFlash] = useState<{ square: string; kind: "good" | "bad"; id: number } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const [ripple, setRipple] = useState<{ from: string; id: number } | null>(null);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [orientation, setOrientation] = useState<"white" | "black">(() => new PuzzleEngine(puzzle).playerColor);
  const [announce, setAnnounce] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [sanInput, setSanInput] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const [revealTick, setRevealTick] = useState(0);

  // Reinicia a animação de "tremida" sem remontar o tabuleiro.
  const shake = useCallback(() => {
    const el = shakeRef.current;
    if (!el) return;
    el.classList.remove("dc-shake");
    void el.offsetWidth;
    el.classList.add("dc-shake");
  }, []);

  const sound = useCallback(
    (name: Parameters<typeof playSound>[0]) => {
      if (settings.sound) playSound(name);
    },
    [settings.sound],
  );

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const colorName = useCallback((fenStr: string) => (fenStr.split(" ")[1] === "w" ? ta("white") : ta("black")), [ta]);

  const announceMove = useCallback(
    (fenBefore: string, uci: string) => {
      const engine = engineRef.current!;
      setAnnounce(ta("moved", { color: colorName(fenBefore), move: engine.toSan(uci, fenBefore) }));
    },
    [ta, colorName],
  );

  // (Re)inicia o puzzle.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const engine = new PuzzleEngine(puzzle);
    engineRef.current = engine;
    stats.current = { mistakes: 0, hints: 0, struggle: false, revealed: false, marks: [], start: 0, finished: false };
    setFen(puzzle.fen);
    setPhase("intro");
    setLastMove(null);
    setSelected(null);
    setHint(null);
    setHintLevel(0);
    setFeedback(null);
    setFlash(null);
    setRipple(null);
    setPromo(null);
    setRevealTick(0);
    setOrientation(engine.playerColor);
    setProgress({ done: 0, total: engine.totalPlayerMoves });

    const begin = () => {
      stats.current.start = performance.now();
      setPhase("play");
    };
    if (puzzle.opponentFirst === false) {
      begin();
    } else {
      later(() => {
        const before = engine.fen;
        const uci = engine.start();
        if (uci) {
          setFen(engine.fen);
          setLastMove(parseUci(uci));
          sound(isCapture(before, uci) ? "capture" : "move");
          announceMove(before, uci);
        }
        begin();
      }, 650);
    }
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey]);

  const finish = useCallback(
    (solved: boolean) => {
      const s = stats.current;
      if (s.finished) return;
      s.finished = true;
      setPhase("done");
      onFinish({
        solved,
        revealed: s.revealed,
        mistakes: s.mistakes,
        hints: s.hints,
        timeMs: performance.now() - s.start,
        marks: s.marks,
      });
    },
    [onFinish],
  );

  /** Tenta um lance do jogador. Retorna true se a peça deve ficar onde foi solta. */
  const attempt = useCallback(
    (from: Square, to: Square, promotion?: string, viaReveal = false): boolean => {
      const engine = engineRef.current;
      if (!engine || phase !== "play") return false;
      if (!promotion && engine.needsPromotion(from, to)) {
        setPromo({ from, to });
        return false;
      }
      const before = engine.fen;
      const result = engine.tryMove(from, to, promotion);
      setSelected(null);
      const s = stats.current;

      if (result.kind === "illegal") return false;

      if (result.kind === "wrong") {
        s.mistakes++;
        s.struggle = true;
        setFlash({ square: to, kind: "bad", id: Date.now() });
        setFeedback({ kind: "bad", id: Date.now() });
        shake();
        sound("bad");
        vibrate(90);
        if (failOnMistake) {
          s.marks.push("struggle");
          later(() => finish(false), 500);
          setPhase("wait");
        }
        return false;
      }

      s.marks.push(viaReveal ? "revealed" : s.struggle ? "struggle" : "clean");
      s.struggle = false;
      setHint(null);
      setHintLevel(0);
      setFlash({ square: to, kind: "good", id: Date.now() });
      setProgress({ done: engine.playerMovesDone, total: engine.totalPlayerMoves });
      announceMove(before, result.uci);

      if (result.kind === "solved") {
        setFen(engine.fen);
        setLastMove({ from, to });
        setRipple({ from: to, id: Date.now() });
        setFeedback({ kind: s.revealed ? "revealed" : "solved", id: Date.now() });
        sound(isCapture(before, result.uci) ? "capture" : "move");
        later(() => sound("solved"), 120);
        vibrate([30, 50, 30]);
        finish(!s.revealed);
        return true;
      }

      // Lance certo: mostra o lance, depois a resposta do adversário.
      setFen(result.fenAfterMove);
      setLastMove({ from, to });
      setFeedback({ kind: "good", id: Date.now() });
      sound(isCapture(before, result.uci) ? "capture" : "move");
      later(() => sound("good"), 90);
      setPhase("wait");
      later(() => {
        setFen(engine.fen);
        setLastMove(parseUci(result.reply));
        sound(isCapture(result.fenAfterMove, result.reply) ? "capture" : "move");
        announceMove(result.fenAfterMove, result.reply);
        setPhase("play");
      }, 520);
      return true;
    },
    [phase, failOnMistake, sound, later, finish, announceMove, shake],
  );

  // Ver solução: joga os lances restantes automaticamente.
  useEffect(() => {
    if (!revealTick || phase !== "play") return;
    const engine = engineRef.current!;
    const next = engine.expected;
    if (!next) return;
    const { from, to, promotion } = parseUci(next);
    const id = window.setTimeout(() => {
      const kept = attempt(from, to, promotion, true);
      if (kept && !engine.solved) setRevealTick((n) => n + 1);
    }, 350);
    return () => clearTimeout(id);
  }, [revealTick, phase, attempt]);

  const reveal = () => {
    if (phase !== "play") return;
    stats.current.revealed = true;
    setRevealTick((n) => n + 1);
  };

  const giveHint = () => {
    const engine = engineRef.current;
    if (!engine || phase !== "play" || hintLevel >= 2) return;
    const level = (hintLevel + 1) as 1 | 2;
    setHint(engine.hint(level));
    setHintLevel(level);
    stats.current.hints++;
    stats.current.struggle = true;
  };

  const isTarget = useCallback(
    (sq: string) => !!selected && !!engineRef.current?.legalTargets(selected).includes(sq as Square),
    [selected],
  );
  const canPick = useCallback(
    (sq: string) => {
      const engine = engineRef.current;
      if (!engine || phase !== "play") return false;
      const piece = new Chess(engine.fen).get(sq as Square);
      return !!piece && piece.color === engine.playerColor[0];
    },
    [phase],
  );
  const onSelect = useCallback((sq: string | null) => setSelected(sq as Square | null), []);
  const onMove = useCallback((from: string, to: string) => attempt(from as Square, to as Square), [attempt]);

  const onSanSubmit = (e: FormEvent) => {
    e.preventDefault();
    const engine = engineRef.current;
    if (!engine) return;
    const move = engine.parseSan(sanInput);
    if (!move) {
      setFeedback({ kind: "bad", id: Date.now() });
      shake();
      return;
    }
    attempt(move.from, move.to, move.promotion);
    setSanInput("");
  };

  // Estilos de casas: último lance, seleção, destinos, dica, xeque, flashes e onda de vitória.
  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    const add = (sq: string, style: CSSProperties) => {
      styles[sq] = { ...styles[sq], ...style };
    };
    if (lastMove) {
      add(lastMove.from, { backgroundColor: "rgba(255, 209, 82, 0.42)" });
      add(lastMove.to, { backgroundColor: "rgba(255, 209, 82, 0.55)" });
    }
    const board = new Chess(fen);
    if (board.inCheck()) {
      const turn = board.turn();
      for (const row of board.board())
        for (const p of row)
          if (p && p.type === "k" && p.color === turn)
            add(p.square, { backgroundImage: "radial-gradient(circle, rgba(226, 60, 48, 0.85) 0%, rgba(226, 60, 48, 0.35) 45%, transparent 72%)" });
    }
    if (selected && engineRef.current) {
      add(selected, { backgroundColor: "rgba(30, 110, 80, 0.5)" });
      for (const target of engineRef.current.legalTargets(selected)) {
        const occupied = !!board.get(target);
        add(target, {
          backgroundImage: occupied
            ? "radial-gradient(circle, transparent 58%, rgba(20, 60, 40, 0.38) 60%)"
            : "radial-gradient(circle, rgba(20, 60, 40, 0.34) 22%, transparent 24%)",
          cursor: "pointer",
        });
      }
    }
    if (hint) {
      add(hint.from, { boxShadow: "inset 0 0 0 4px var(--accent)", backgroundColor: "rgba(240, 177, 79, 0.35)" });
    }
    if (flash) {
      add(flash.square, {
        backgroundColor: flash.kind === "good" ? "rgba(52, 168, 98, 0.6)" : "rgba(214, 64, 52, 0.62)",
        transition: "background-color 300ms ease-out",
      });
    }
    return styles;
  }, [fen, lastMove, selected, hint, flash]);

  const player = engineRef.current?.playerColor ?? "white";

  const arrows = useMemo(() => (hint?.to ? [{ from: hint.from, to: hint.to }] : []), [hint]);

  const statusText = (() => {
    if (phase === "intro") return t("opponentThinking");
    if (feedback?.kind === "solved") return t("solved");
    if (feedback?.kind === "revealed") return t("revealed");
    if (feedback?.kind === "bad" && phase !== "done") return t("wrong");
    if (feedback?.kind === "good") return t("correct");
    return goal;
  })();

  const statusTone =
    feedback?.kind === "bad"
      ? "text-bad"
      : feedback?.kind === "good" || feedback?.kind === "solved"
        ? "text-good"
        : "text-ink";

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 650);
    return () => clearTimeout(id);
  }, [flash]);

  // Limpa o feedback de erro/acerto depois de um tempo.
  useEffect(() => {
    if (!feedback || feedback.kind === "solved" || feedback.kind === "revealed") return;
    const id = window.setTimeout(() => setFeedback(null), 1600);
    return () => clearTimeout(id);
  }, [feedback]);

  return (
    <div className="flex w-full flex-col gap-3">
      {/* A instrução é o título do momento: quebra em até duas linhas, nunca é cortada. */}
      <div className="flex min-h-12 items-start justify-between gap-3 px-1">
        <p
          key={feedback?.id ?? phase}
          className={`dc-rise min-w-0 font-display text-lg leading-snug font-semibold text-balance sm:text-xl ${statusTone}`}
        >
          {statusText}
        </p>
        <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
          <span className="inline-flex h-7 items-center gap-2 rounded-full bg-surface px-2.5 text-xs font-semibold text-ink-2 ring-1 ring-line">
            <span
              aria-hidden
              className={`size-3 rounded-full ${player === "white" ? "bg-white ring-1 ring-ink/30" : "bg-[#1b1b1b] ring-1 ring-white/20"}`}
            />
            {player === "white" ? t("whiteToMove") : t("blackToMove")}
          </span>
          <ol className="flex gap-1" aria-label={t("progress", progress)}>
            {Array.from({ length: progress.total }, (_, i) => {
              const mark = stats.current.marks[i];
              const tone =
                mark === "clean" ? "bg-good" : mark === "struggle" ? "bg-accent" : mark === "revealed" ? "bg-bad" : "bg-line";
              return <li key={i} className={`h-1.5 w-4 rounded-full transition-colors duration-300 ${tone}`} />;
            })}
          </ol>
        </div>
      </div>

      <div ref={shakeRef} className="relative">
        <div className="overflow-hidden rounded-xl shadow-card ring-1 ring-black/5" aria-label={ta("board")} role="application">
          <Board
            fen={fen}
            orientation={orientation}
            theme={settings.boardTheme}
            squareStyles={squareStyles}
            arrows={arrows}
            ripple={ripple}
            interactive={phase === "play"}
            selected={selected}
            canPick={canPick}
            isTarget={isTarget}
            onSelect={onSelect}
            onMove={onMove}
          />
        </div>
        {promo && (
          <PromotionPicker
            color={player}
            onCancel={() => setPromo(null)}
            onPick={(p) => {
              const { from, to } = promo;
              setPromo(null);
              attempt(from, to, p);
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        {allowHints && (
          <button
            type="button"
            onClick={giveHint}
            disabled={phase !== "play" || hintLevel >= 2}
            aria-label={t("hintAria", { n: 2 - hintLevel })}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-accent-soft pr-2 pl-4 text-sm font-semibold text-ink transition hover:brightness-95 active:scale-[0.97] disabled:opacity-40"
          >
            <Lightbulb className="size-4 text-accent" strokeWidth={2.25} />
            {t("hint")}
            <span className="grid size-6 place-items-center rounded-full bg-surface/70 font-mono text-xs tabular" aria-hidden>
              {2 - hintLevel}
            </span>
          </button>
        )}
        {allowSolution && (
          <button
            type="button"
            onClick={reveal}
            disabled={phase !== "play"}
            aria-label={t("showSolution")}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-semibold text-ink transition hover:bg-line active:scale-[0.97] disabled:opacity-40"
          >
            <Eye className="size-4" strokeWidth={2.25} />
            <span className="sm:hidden">{t("solutionShort")}</span>
            <span className="hidden sm:inline">{t("showSolution")}</span>
          </button>
        )}
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setShowKeyboard((v) => !v)}
            aria-pressed={showKeyboard}
            aria-label={t("moveInputLabel")}
            title={t("moveInputLabel")}
            className="grid size-11 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 aria-pressed:bg-surface-2 aria-pressed:text-ink"
          >
            <Keyboard className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
            aria-label={t("flip")}
            title={t("flip")}
            className="grid size-11 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2"
          >
            <RefreshCw className="size-5" />
          </button>
        </div>
      </div>

      {showKeyboard && (
        <form onSubmit={onSanSubmit} className="dc-rise flex gap-2">
          <label className="sr-only" htmlFor="san-input">
            {t("moveInputLabel")}
          </label>
          <input
            id="san-input"
            value={sanInput}
            onChange={(e) => setSanInput(e.target.value)}
            placeholder={t("moveInput")}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 font-mono text-base text-ink placeholder:text-ink-2/70"
          />
          <button type="submit" className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink">
            {t("play")}
          </button>
        </form>
      )}

      <p className="sr-only" aria-live="polite">
        {announce} {feedback ? statusText : ""}
      </p>
    </div>
  );
});
