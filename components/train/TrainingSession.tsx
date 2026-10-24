"use client";

import { ArrowLeft, ArrowRight, Flame, RotateCcw, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { PuzzleBoard, type PuzzleOutcome } from "@/components/board/PuzzleBoard";
import { useGoal } from "@/components/puzzle/DailyChallenge";
import { Link } from "@/i18n/navigation";
import { useHydrated, useStore } from "@/lib/store";
import type { Puzzle, ThemeKey } from "@/lib/types";

export function TrainingSession({ theme }: { theme: ThemeKey }) {
  const t = useTranslations();
  const hydrated = useHydrated();
  const rating = useStore((s) => s.rating);
  const recordTraining = useStore((s) => s.recordTraining);
  const [queue, setQueue] = useState<Puzzle[]>([]);
  const [current, setCurrent] = useState<Puzzle | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<{ success: boolean; solved: boolean; delta: number } | null>(null);
  const [run, setRun] = useState(0);
  const [error, setError] = useState(false);
  const loading = useRef(false);

  const fetchBatch = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const { rating: r, seen } = useStore.getState();
      const qs = new URLSearchParams({ theme, rating: String(r), exclude: seen.slice(-200).join(",") });
      const res = await fetch(`/api/puzzles?${qs}`);
      if (!res.ok) throw new Error();
      const batch: Puzzle[] = await res.json();
      setQueue((q) => [...q, ...batch.filter((p) => !q.some((x) => x.id === p.id))]);
      setError(false);
    } catch {
      setError(true);
    } finally {
      loading.current = false;
    }
  }, [theme]);

  useEffect(() => {
    if (hydrated) void fetchBatch();
  }, [hydrated, fetchBatch]);

  // Pega o próximo puzzle da fila e reabastece quando estiver acabando.
  useEffect(() => {
    if (!current && queue.length) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
    if (queue.length < 3 && hydrated) void fetchBatch();
  }, [current, queue, hydrated, fetchBatch]);

  const onFinish = useCallback(
    (o: PuzzleOutcome) => {
      if (!current) return;
      // Na primeira tentativa vale rating; repetições não contam.
      if (attempt > 0) {
        setOutcome({ success: o.solved && o.mistakes === 0, solved: o.solved, delta: 0 });
        return;
      }
      const success = o.solved && o.mistakes === 0 && o.hints === 0;
      const before = useStore.getState().rating;
      recordTraining({ id: current.id, theme, puzzleRating: current.rating, success });
      setOutcome({ success, solved: o.solved, delta: useStore.getState().rating - before });
      setRun((n) => (success ? n + 1 : 0));
    },
    [current, attempt, theme, recordTraining],
  );

  const next = () => {
    setOutcome(null);
    setAttempt(0);
    setCurrent(null);
  };

  const retry = () => {
    setOutcome(null);
    setAttempt((n) => n + 1);
  };

  const goal = useGoal(theme);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-10">
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
          <Link href="/treino" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink" aria-label={t("train.back")}>
            <ArrowLeft className="size-4" />
            <span className="font-display text-xl font-extrabold tracking-tight text-ink">{t(`themes.${theme}.name`)}</span>
          </Link>
          <span className="font-mono text-sm font-semibold text-ink-2 tabular">{hydrated ? rating : "—"}</span>
        </div>
        {current ? (
          <PuzzleBoard puzzle={current} puzzleKey={`${current.id}-${attempt}`} goal={goal} onFinish={onFinish} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="h-11" />
            <div className="grid aspect-square place-items-center rounded-xl bg-surface-2 text-ink-2">
              {error ? (
                <div className="flex max-w-xs flex-col items-center gap-3 text-center">
                  <p>{t("train.error")}</p>
                  <button type="button" onClick={() => fetchBatch()} className="h-11 rounded-full bg-brand px-5 font-semibold text-brand-ink">
                    {t("puzzle.retry")}
                  </button>
                </div>
              ) : (
                <span className="animate-pulse">{t("train.loading")}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        <Link href="/treino" className="hidden items-center gap-1.5 self-start text-sm font-semibold text-ink-2 hover:text-ink lg:inline-flex">
          <ArrowLeft className="size-4" /> {t("train.back")}
        </Link>
        <header className="hidden lg:block">
          <h1 className="font-display text-4xl font-extrabold tracking-tight lg:text-5xl">{t(`themes.${theme}.name`)}</h1>
          <p className="mt-2 leading-relaxed text-ink-2">{t(`themes.${theme}.desc`)}</p>
        </header>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-9 items-center rounded-full bg-surface px-4 text-sm font-semibold ring-1 ring-line tabular">
            {t("train.yourRating", { rating: hydrated ? rating : "—" })}
          </span>
          {run > 1 && (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-sm font-semibold">
              <Flame className="size-4 fill-accent text-accent" /> {t("train.streakLabel", { n: run })}
            </span>
          )}
          {current && (
            <span className="inline-flex h-9 items-center rounded-full bg-surface-2 px-4 text-sm text-ink-2 tabular">
              {t("puzzle.puzzleRating", { rating: current.rating })}
            </span>
          )}
        </div>

        {outcome && (
          <section className="dc-rise flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-card ring-1 ring-line/60" aria-live="polite">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className={`font-display text-2xl font-extrabold ${outcome.success ? "text-good" : "text-ink"}`}>
                {outcome.success ? t("puzzle.solved") : outcome.solved ? t("result.solvedHelp") : t("puzzle.revealed")}
              </h2>
              {outcome.delta !== 0 && (
                <span className={`font-mono text-lg font-bold tabular ${outcome.delta > 0 ? "text-good" : "text-bad"}`}>
                  {outcome.delta > 0 ? `+${outcome.delta}` : outcome.delta}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={next}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand font-semibold text-brand-ink transition hover:bg-brand-2 active:scale-[0.98]"
                autoFocus
              >
                {t("puzzle.next")} <ArrowRight className="size-5" />
              </button>
              <button
                type="button"
                onClick={retry}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-surface-2 px-5 font-semibold transition hover:bg-line"
              >
                <RotateCcw className="size-4" /> {t("puzzle.retry")}
              </button>
            </div>
            {current?.gameUrl && (
              <a href={current.gameUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 self-start text-sm font-semibold text-ink-2 hover:text-ink">
                {t("puzzle.viewGame")} <ExternalLink className="size-3.5" />
              </a>
            )}
          </section>
        )}
      </aside>
    </div>
  );
}
