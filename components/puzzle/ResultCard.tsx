"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildShareText, formatTime } from "@/lib/share";
import type { DailyRecord } from "@/lib/streak";
import type { ThemeKey } from "@/lib/types";
import { useCountdown } from "@/lib/useCountdown";
import { ShareButton } from "./ShareButton";

const MARK_TONE = { clean: "bg-good", struggle: "bg-accent", revealed: "bg-bad" } as const;

export function ResultCard({
  record,
  number,
  theme,
  streak,
  gameUrl,
  showCountdown,
}: {
  record: DailyRecord;
  number: number;
  theme: ThemeKey;
  streak: number;
  gameUrl?: string;
  showCountdown: boolean;
}) {
  const t = useTranslations("result");
  const tt = useTranslations("themes");
  const td = useTranslations("daily");
  const tp = useTranslations("puzzle");
  const countdown = useCountdown();
  const solved = record.status === "solved";
  const clean = solved && record.mistakes === 0 && record.hints === 0;

  const shareText = buildShareText({
    number,
    marks: record.marks,
    timeMs: record.timeMs,
    streak,
    solved,
    url: typeof window !== "undefined" ? window.location.host : "dailychess.app",
  });

  const stats = [
    { label: t("time"), value: formatTime(record.timeMs) },
    { label: t("mistakes"), value: record.mistakes },
    { label: t("hints"), value: record.hints },
    { label: t("streak"), value: streak },
  ];

  return (
    <section className="dc-rise flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-card ring-1 ring-line/60 sm:p-6" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`font-display text-3xl font-extrabold tracking-tight ${solved ? "text-good" : "text-ink"}`}>
            {solved ? t("solvedTitle") : t("failedTitle")}
          </h2>
          <p className="mt-1 text-ink-2">{solved ? (clean ? t("solvedClean") : t("solvedHelp")) : tp("revealed")}</p>
        </div>
        <ol className="flex shrink-0 gap-1.5 pt-2" aria-hidden>
          {record.marks.map((m, i) => (
            <li key={i} className={`size-6 rounded-md ${MARK_TONE[m]}`} />
          ))}
        </ol>
      </div>

      <dl className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-surface-2 px-2 py-3 text-center">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">{s.label}</dt>
            <dd className="mt-0.5 font-display text-xl font-bold tabular">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2">
        <ShareButton text={shareText} />
      </div>

      <div className="rounded-2xl border border-line p-4">
        <h3 className="font-semibold">{t("aboutTheme", { theme: tt(`${theme}.name`) })}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">{tt(`${theme}.desc`)}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <Link href={`/treino/${theme}`} className="inline-flex items-center gap-1 text-brand hover:underline">
            {t("trainTheme", { theme: tt(`${theme}.name`) })} <ArrowRight className="size-4" />
          </Link>
          {gameUrl && (
            <a href={gameUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
              {tp("viewGame")} <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      {showCountdown && (
        <p className="text-center text-sm text-ink-2">
          {td.rich("nextIn", { time: countdown, t: (c) => <span className="font-mono font-semibold text-ink tabular">{c}</span> })}
        </p>
      )}
    </section>
  );
}
