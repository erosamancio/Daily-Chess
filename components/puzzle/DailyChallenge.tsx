"use client";

import { CalendarDays, Check } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { PuzzleBoard, type PuzzleOutcome } from "@/components/board/PuzzleBoard";
import { Link } from "@/i18n/navigation";
import { weekday } from "@/lib/daily";
import { useHydrated, useStore, useStreak } from "@/lib/store";
import type { DailyRecord } from "@/lib/streak";
import { DAILY_LEVELS, type DailyEntry, type DailyLevel, type Puzzle, type ThemeKey } from "@/lib/types";
import { Onboarding } from "./Onboarding";
import { ResultCard } from "./ResultCard";
import { WeekStrip } from "./WeekStrip";

export function useGoal(theme: ThemeKey) {
  const t = useTranslations("puzzle");
  const mate = /^mateIn(\d)$/.exec(theme);
  return mate ? t("findMate", { n: Number(mate[1]) }) : t("findBest");
}

export function DailyChallenge({
  entry,
  levels,
  mode,
}: {
  entry: DailyEntry;
  levels: { easy: Puzzle; hard: Puzzle } | null;
  mode: "today" | "archive";
}) {
  const t = useTranslations();
  const format = useFormatter();
  const hydrated = useHydrated();
  const { date, number } = entry;
  const [level, setLevel] = useState<DailyLevel>("normal");
  const puzzle = level === "normal" || !levels ? entry.puzzle : levels[level];
  const savedNormal = useStore((s) => s.daily[date] ?? (mode === "archive" ? s.archive[date] : undefined));
  const savedLevels = useStore((s) => s.dailyLevels[date]);
  const recordDaily = useStore((s) => s.recordDaily);
  const recordArchive = useStore((s) => s.recordArchive);
  const recordDailyLevel = useStore((s) => s.recordDailyLevel);
  const addReview = useStore((s) => s.addReview);
  const onboarded = useStore((s) => s.settings.onboarded);
  const streak = useStreak();
  const [records, setRecords] = useState<Partial<Record<DailyLevel, DailyRecord>>>({});
  const resultRef = useRef<HTMLDivElement>(null);
  const goal = useGoal(puzzle.theme);
  const wd = weekday(date);

  const savedFor = (l: DailyLevel) => (l === "normal" ? savedNormal : l === "easy" || l === "hard" ? savedLevels?.[l] : undefined);
  const record = records[level] ?? null;

  const onFinish = useCallback(
    (o: PuzzleOutcome) => {
      const rec: DailyRecord = {
        status: o.solved ? "solved" : "failed",
        mistakes: o.mistakes,
        hints: o.hints,
        timeMs: Math.round(o.timeMs),
        marks: o.marks,
      };
      setRecords((r) => ({ ...r, [level]: rec }));
      if (!o.solved || o.mistakes > 0 || o.hints > 0) addReview(puzzle);
      if (level !== "normal") recordDailyLevel(date, level, rec);
      else if (mode === "today") recordDaily(date, rec);
      else recordArchive(date, rec);
    },
    [date, mode, level, puzzle, recordDaily, recordArchive, recordDailyLevel, addReview],
  );

  useEffect(() => {
    if (record && window.matchMedia("(max-width: 1023px)").matches) {
      const id = setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 900);
      return () => clearTimeout(id);
    }
  }, [record]);

  const shown = record ?? (hydrated ? savedFor(level) : undefined) ?? null;
  const dateLabel = format.dateTime(new Date(`${date}T12:00:00Z`), { day: "numeric", month: "long", timeZone: "UTC" });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-10">
      <header className="-mb-2 flex items-center justify-between gap-3 lg:hidden">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight">
            {mode === "today" ? t("daily.title") : t("archive.pastDay", { date: dateLabel })}
          </h1>
          <p className="text-xs text-ink-2">
            {t("daily.number", { n: number })} · {t(`weekday.${wd}`)}, {dateLabel}
          </p>
        </div>
        <LevelChip wd={wd} level={level} rating={puzzle.rating} />
      </header>

      <div className="flex min-w-0 flex-col gap-3">
        {levels && (
          <LevelTabs
            level={level}
            onChange={setLevel}
            done={(l) => hydrated && !!(records[l] ?? savedFor(l))}
          />
        )}
        <PuzzleBoard puzzle={puzzle} puzzleKey={`${date}-${level}`} goal={goal} onFinish={onFinish} />
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
            <LevelChip wd={wd} level={level} rating={puzzle.rating} />
          </div>
        </header>

        <div ref={resultRef} className="scroll-mt-20">
          {shown && (
            <ResultCard
              record={shown}
              number={number}
              theme={puzzle.theme}
              level={level === "normal" ? undefined : t(`daily.levels.${level}`)}
              streak={mode === "today" && level === "normal" ? streak.current : 0}
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

function LevelTabs({ level, onChange, done }: { level: DailyLevel; onChange: (l: DailyLevel) => void; done: (l: DailyLevel) => boolean }) {
  const t = useTranslations("daily");
  return (
    <div role="tablist" aria-label={t("levelsLabel")} title={t("normalCountsStreak")} className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-0.5 sm:p-1">
      {DAILY_LEVELS.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={level === l}
          onClick={() => onChange(l)}
          className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors sm:h-9 ${
            level === l ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink"
          }`}
        >
          {t(`levels.${l}`)}
          {done(l) && (
            <>
              <Check className="size-3.5 text-good" strokeWidth={3} aria-hidden />
              <span className="sr-only">({t("levelDone")})</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

function LevelChip({ wd, level, rating }: { wd: number; level: DailyLevel; rating: number }) {
  const t = useTranslations();
  const tone =
    level === "easy"
      ? "bg-good-soft text-good"
      : level === "hard"
        ? "bg-ink text-bg"
        : wd === 0
          ? "bg-ink text-bg"
          : wd >= 5
            ? "bg-bad-soft text-bad"
            : wd >= 3
              ? "bg-accent-soft text-ink"
              : "bg-good-soft text-good";
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${tone}`} title={t("daily.ratingTitle")}>
      {level === "normal" ? t(`level.${wd}`) : t(`daily.levels.${level}`)}
      <span aria-hidden>·</span>
      <span className="font-mono font-medium tabular">
        <span className="sr-only">{t("daily.ratingTitle")}: </span>
        {rating}
      </span>
    </span>
  );
}
