"use client";

import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { PuzzleBoard, type PuzzleOutcome } from "@/components/board/PuzzleBoard";
import { useGoal } from "@/components/puzzle/DailyChallenge";
import { Link } from "@/i18n/navigation";
import { useHydrated, useStore } from "@/lib/store";
import type { Puzzle } from "@/lib/types";

/** Refaz os puzzles que deram errado. Resolver sem erro e sem dica tira o puzzle da lista. */
export function ReviewSession() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const review = useStore((s) => s.review);
  const clearReview = useStore((s) => s.clearReview);
  const cleared = useStore((s) => s.reviewCleared);
  // A fila é uma cópia: tirar um puzzle da lista salva não troca o tabuleiro no meio do lance.
  const [queue, setQueue] = useState<Puzzle[] | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<"clean" | "again" | null>(null);

  useEffect(() => {
    if (hydrated && queue === null) setQueue(useStore.getState().review);
  }, [hydrated, queue]);

  const current = queue?.[0];
  const goal = useGoal(current?.theme ?? "fork");

  const onFinish = useCallback(
    (o: PuzzleOutcome) => {
      if (!current) return;
      const clean = o.solved && o.mistakes === 0 && o.hints === 0;
      if (clean) clearReview(current.id);
      setOutcome(clean ? "clean" : "again");
    },
    [current, clearReview],
  );

  const next = () => {
    setQueue((q) => {
      if (!q || !q.length) return q;
      const [head, ...rest] = q;
      return outcome === "clean" ? rest : [...rest, head];
    });
    setOutcome(null);
    setAttempt((n) => n + 1);
  };

  const header = (
    <header className="flex flex-col gap-2">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{t("review.title")}</h1>
      <p className="max-w-prose leading-relaxed text-ink-2">{t("review.subtitle")}</p>
    </header>
  );

  if (!hydrated || queue === null) return <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />;

  if (!current) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <section className="flex flex-col items-start gap-4 rounded-3xl bg-surface p-6 ring-1 ring-line/60">
          <span className="grid size-12 place-items-center rounded-2xl bg-good-soft text-good">
            <Check className="size-6" strokeWidth={2.5} />
          </span>
          <p className="font-display text-2xl font-bold">{review.length ? t("review.doneSession") : t("review.empty")}</p>
          {cleared > 0 && <p className="text-ink-2">{t("review.clearedTotal", { n: cleared })}</p>}
          <Link href="/treino" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 font-semibold text-brand-ink">
            {t("review.goTrain")} <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-10">
      <div className="min-w-0">
        <PuzzleBoard puzzle={current} puzzleKey={`${current.id}-${attempt}`} goal={goal} onFinish={onFinish} />
      </div>
      <aside className="order-first flex min-w-0 flex-col gap-5 lg:order-none">
        {header}
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className="inline-flex h-9 items-center rounded-full bg-surface px-4 ring-1 ring-line tabular">
            {t("review.left", { n: queue.length })}
          </span>
          <span className="inline-flex h-9 items-center rounded-full bg-surface-2 px-4 text-ink-2">{t(`themes.${current.theme}.name`)}</span>
        </div>
        {/* No celular o resultado fica preso acima da barra de baixo: "Próximo" sempre à vista, sem rolar. */}
        {outcome && (
          <section
            className="dc-rise z-20 flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-line/60 max-lg:fixed max-lg:inset-x-3 max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] sm:max-lg:mx-auto sm:max-lg:max-w-lg lg:gap-4 lg:p-5"
            aria-live="polite"
          >
            <h2 className={`font-display text-lg font-extrabold lg:text-2xl ${outcome === "clean" ? "text-good" : "text-ink"}`}>
              {outcome === "clean" ? t("review.cleared") : t("review.again")}
            </h2>
            <button
              type="button"
              onClick={next}
              autoFocus
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand font-semibold text-brand-ink transition hover:bg-brand-2 active:scale-[0.98]"
            >
              {queue.length > 1 || outcome === "again" ? (
                <>
                  {t("puzzle.next")} <ArrowRight className="size-5" />
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" /> {t("review.finish")}
                </>
              )}
            </button>
          </section>
        )}
      </aside>
    </div>
  );
}
