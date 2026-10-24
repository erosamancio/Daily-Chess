"use client";

import { Heart, Play, RotateCcw, Timer, TrendingUp, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { PuzzleBoard, type PuzzleOutcome } from "@/components/board/PuzzleBoard";
import { useGoal } from "@/components/puzzle/DailyChallenge";
import { formatTime } from "@/lib/share";
import { useHydrated, useStore } from "@/lib/store";
import type { Puzzle } from "@/lib/types";

const DURATION_MS = 180_000;
const LIVES = 3;

type Status = "idle" | "loading" | "playing" | "over";

export function RushGame() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const best = useStore((s) => s.rushBest);
  const recordRush = useStore((s) => s.recordRush);
  const [status, setStatus] = useState<Status>("idle");
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [remaining, setRemaining] = useState(DURATION_MS);
  const [results, setResults] = useState<boolean[]>([]);
  const [prevBest, setPrevBest] = useState(0);
  const endAt = useRef(0);

  const start = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/puzzles?mode=rush");
      const list: Puzzle[] = await res.json();
      setPuzzles(list);
      setIndex(0);
      setScore(0);
      setLives(LIVES);
      setResults([]);
      setPrevBest(useStore.getState().rushBest);
      endAt.current = performance.now() + DURATION_MS;
      setRemaining(DURATION_MS);
      setStatus("playing");
    } catch {
      setStatus("idle");
    }
  };

  const end = useCallback(
    (finalScore: number) => {
      setStatus("over");
      recordRush(finalScore);
    },
    [recordRush],
  );

  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => {
      const left = endAt.current - performance.now();
      setRemaining(Math.max(0, left));
      if (left <= 0) end(score);
    }, 200);
    return () => clearInterval(id);
  }, [status, score, end]);

  const onFinish = useCallback(
    (o: PuzzleOutcome) => {
      const newScore = score + (o.solved ? 1 : 0);
      const newLives = lives - (o.solved ? 0 : 1);
      setScore(newScore);
      setLives(newLives);
      setResults((r) => [...r, o.solved]);
      if (newLives <= 0 || index + 1 >= puzzles.length) {
        window.setTimeout(() => end(newScore), 500);
        return;
      }
      window.setTimeout(() => setIndex((i) => i + 1), o.solved ? 450 : 700);
    },
    [score, lives, index, puzzles.length, end],
  );

  const current = puzzles[index];
  const goal = useGoal(current?.theme ?? "fork");
  const low = remaining < 30_000;

  if (status === "playing" && current) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0">
          <PuzzleBoard
            puzzle={current}
            puzzleKey={`${current.id}-${index}`}
            goal={goal}
            allowHints={false}
            allowSolution={false}
            failOnMistake
            onFinish={onFinish}
          />
        </div>
        <aside className="order-first flex flex-col gap-4 lg:order-none">
          <div className="grid grid-cols-3 gap-2 rounded-3xl bg-surface p-3 shadow-card ring-1 ring-line/60 lg:grid-cols-1 lg:p-5">
            <Stat label={t("rush.timeLeft")}>
              <span className={`font-mono tabular ${low ? "text-bad" : ""}`}>{formatTime(remaining)}</span>
            </Stat>
            <Stat label={t("rush.score")}>
              <span className="tabular">{score}</span>
            </Stat>
            <Stat label={t("rush.lives")}>
              <span className="flex gap-1">
                {Array.from({ length: LIVES }, (_, i) => (
                  <Heart key={i} className={`size-6 transition ${i < lives ? "fill-bad text-bad" : "text-line"}`} />
                ))}
              </span>
            </Stat>
          </div>
          <ResultTrail results={results} />
        </aside>
      </div>
    );
  }

  const isOver = status === "over";
  const record = isOver && score > prevBest && score > 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 py-2 sm:gap-10 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
      <ChessClock
        className="lg:order-last"
        label={isOver ? t("rush.scoreLabel") : t("rush.timeLeft")}
        value={isOver ? String(score) : "3:00"}
        lives={isOver ? lives : LIVES}
        livesLabel={t("rush.lives")}
        ariaLabel={isOver ? t("rush.finalScore", { n: score }) : t("rush.clockLabel")}
      />
      <div className="flex flex-col items-start gap-7">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">{isOver ? t("rush.over") : t("rush.title")}</h1>
          <p className="mt-3 max-w-prose text-lg leading-relaxed text-ink-2">
            {isOver ? t("rush.finalScore", { n: score }) : t("rush.subtitle")}
          </p>
        </div>
        {!isOver && (
          <ul className="flex flex-col gap-3">
            {[
              { icon: Timer, text: t("rush.rule1") },
              { icon: Heart, text: t("rush.rule2") },
              { icon: TrendingUp, text: t("rush.rule3") },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] font-medium">
                <Icon className="size-5 shrink-0 text-accent" strokeWidth={2.2} />
                {text}
              </li>
            ))}
          </ul>
        )}
        {isOver && (
          <div className="flex w-full flex-col gap-3">
            {record && (
              <p className="dc-rise inline-flex items-center gap-2 self-start rounded-full bg-accent-soft px-4 py-2 font-semibold">
                <Trophy className="size-5 text-accent" /> {t("rush.newRecord")}
              </p>
            )}
            <ResultTrail results={results} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={start}
            disabled={status === "loading"}
            className="inline-flex h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-semibold text-brand-ink shadow-card transition hover:bg-brand-2 active:scale-[0.98] disabled:opacity-60"
          >
            {isOver ? <RotateCcw className="size-5" /> : <Play className="size-5 fill-current" />}
            {isOver ? t("rush.again") : t("rush.start")}
          </button>
          {hydrated && best > 0 && <span className="font-semibold text-ink-2 tabular">{t("rush.best", { n: best })}</span>}
        </div>
      </div>
    </div>
  );
}

/** Relógio de xadrez: o objeto real do modo Rush. Mantém o corpo escuro nos dois temas. */
function ChessClock({
  label,
  value,
  lives,
  livesLabel,
  ariaLabel,
  className = "",
}: {
  label: string;
  value: string;
  lives: number;
  livesLabel: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <figure role="img" aria-label={ariaLabel} className={`mx-auto w-full max-w-md ${className}`}>
      <div className="flex justify-between px-8 sm:px-10" aria-hidden>
        <span className="h-3.5 w-20 translate-y-px sm:w-24 rounded-t-xl bg-accent" />
        <span className="mt-1.5 h-2 w-20 translate-y-px sm:w-24 rounded-t-xl bg-[#2a3a31]" />
      </div>
      <div className="grid grid-cols-[1.35fr_1fr] gap-2.5 rounded-[2rem] bg-[#15211b] p-3 shadow-[0_2px_4px_rgb(0_0_0/0.2),0_24px_48px_-16px_rgb(19_32_25/0.55)]">
        <div className="flex min-w-0 flex-col gap-1 rounded-[1.4rem] bg-[#0a110d] px-4 py-4 ring-1 ring-white/5 sm:px-5">
          <span className="text-[11px] font-semibold tracking-wide text-[#9fb0a5] uppercase">{label}</span>
          <span className="font-mono text-4xl font-semibold text-[#f0b14f] tabular sm:text-6xl">{value}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-1 rounded-[1.4rem] bg-[#0a110d] px-3 py-4 ring-1 ring-white/5 sm:px-4">
          <span className="text-[11px] font-semibold tracking-wide text-[#9fb0a5] uppercase">{livesLabel}</span>
          <span className="flex flex-1 items-center gap-1 sm:gap-1.5">
            {Array.from({ length: LIVES }, (_, i) => (
              <Heart key={i} className={`size-6 sm:size-7 ${i < lives ? "fill-[#ec6c5f] text-[#ec6c5f]" : "text-[#2a3a31]"}`} />
            ))}
          </span>
        </div>
      </div>
    </figure>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 lg:flex-row lg:justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">{label}</span>
      <span className="font-display text-2xl font-bold lg:text-3xl">{children}</span>
    </div>
  );
}

function ResultTrail({ results }: { results: boolean[] }) {
  if (!results.length) return null;
  return (
    <ol className="flex flex-wrap gap-1.5" aria-hidden>
      {results.map((ok, i) => (
        <li key={i} className={`dc-rise size-4 rounded ${ok ? "bg-good" : "bg-bad"}`} />
      ))}
    </ol>
  );
}
