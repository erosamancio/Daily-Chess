"use client";

import { CalendarDays } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { PuzzleBoard, type PuzzleOutcome } from "@/components/board/PuzzleBoard";
import { Link } from "@/i18n/navigation";
import { weekday } from "@/lib/daily";
import { useHydrated, useStore, useStreak } from "@/lib/store";
import type { DailyRecord } from "@/lib/streak";
import type { DailyEntry, ThemeKey } from "@/lib/types";
import { Onboarding } from "./Onboarding";
import { ResultCard } from "./ResultCard";
import { WeekStrip } from "./WeekStrip";

export function useGoal(theme: ThemeKey) {
  const t = useTranslations("puzzle");
  const mate = /^mateIn(\d)$/.exec(theme);
  return mate ? t("findMate", { n: Number(mate[1]) }) : t("findBest");
}

export function DailyChallenge({ entry, mode }: { entry: DailyEntry; mode: "today" | "archive" }) {
  const t = useTranslations();
  const format = useFormatter();
  const hydrated = useHydrated();
  const { date, number, puzzle } = entry;
  const saved = useStore((s) => s.daily[date] ?? (mode === "archive" ? s.archive[date] : undefined));
  const recordDaily = useStore((s) => s.recordDaily);
  const recordArchive = useStore((s) => s.recordArchive);
  const onboarded = useStore((s) => s.settings.onboarded);
  const streak = useStreak();
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const goal = useGoal(puzzle.theme);
  const wd = weekday(date);

  const onFinish = useCallback(
    (o: PuzzleOutcome) => {
      const rec: DailyRecord = {
        status: o.solved ? "solved" : "failed",
        mistakes: o.mistakes,
        hints: o.hints,
        timeMs: Math.round(o.timeMs),
        marks: o.marks,
      };
      setRecord(rec);
      if (mode === "today") recordDaily(date, rec);
      else recordArchive(date, rec);
    },
    [date, mode, recordDaily, recordArchive],
  );

  // No celular, traz o resultado para a tela depois de resolver.
  useEffect(() => {
    if (record && window.matchMedia("(max-width: 1023px)").matches) {
      const id = setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 900);
      return () => clearTimeout(id);
    }
  }, [record]);

  const shown = record ?? (hydrated ? saved : undefined) ?? null;
  const dateLabel = format.dateTime(new Date(`${date}T12:00:00Z`), { day: "numeric", month: "long", timeZone: "UTC" });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-10">
      <header className="flex items-end justify-between gap-4 lg:hidden">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {mode === "today" ? t("daily.title") : t("archive.pastDay", { date: dateLabel })}
          </h1>
          <p className="text-sm text-ink-2">
            {t("daily.number", { n: number })} · {t(`weekday.${wd}`)}, {dateLabel}
          </p>
        </div>
        <LevelChip wd={wd} rating={puzzle.rating} />
      </header>

      <div className="min-w-0">
        <PuzzleBoard puzzle={puzzle} puzzleKey={`${date}`} goal={goal} onFinish={onFinish} />
      </div>

      <aside className="flex min-w-0 flex-col gap-6">
        <header className="hidden flex-col gap-3 lg:flex">
          <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-balance">
            {mode === "today" ? t("daily.title") : t("archive.pastDay", { date: dateLabel })}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-ink-2">
            <span>
              {t("daily.number", { n: number })} · {t(`weekday.${wd}`)}, {dateLabel}
            </span>
            <LevelChip wd={wd} rating={puzzle.rating} />
          </div>
        </header>

        <div ref={resultRef} className="scroll-mt-20">
          {shown && (
            <ResultCard
              record={shown}
              number={number}
              theme={puzzle.theme}
              streak={mode === "today" ? streak.current : 0}
              gameUrl={puzzle.gameUrl}
              showCountdown={mode === "today"}
            />
          )}
        </div>

        {mode === "today" && (
          <div className="rounded-3xl bg-surface p-5 ring-1 ring-line/60">
            <WeekStrip today={date} />
          </div>
        )}

        <Link
          href="/arquivo"
          className="inline-flex items-center gap-2 self-start text-sm font-semibold text-brand hover:underline"
        >
          <CalendarDays className="size-4" />
          {t("daily.archiveCta")}
        </Link>
      </aside>

      {mode === "today" && hydrated && !onboarded && <Onboarding />}
    </div>
  );
}

function LevelChip({ wd, rating }: { wd: number; rating: number }) {
  const t = useTranslations();
  const tone = wd === 0 ? "bg-ink text-bg" : wd >= 5 ? "bg-bad-soft text-bad" : wd >= 3 ? "bg-accent-soft text-ink" : "bg-good-soft text-good";
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${tone}`} title={t("daily.ratingTitle")}>
      {t(`level.${wd}`)}
      <span aria-hidden>·</span>
      <span className="font-mono font-medium tabular">
        <span className="sr-only">{t("daily.ratingTitle")}: </span>
        {rating}
      </span>
    </span>
  );
}
