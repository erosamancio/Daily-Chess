"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { dayNumber, weekday } from "@/lib/daily";
import { useHydrated, useStore } from "@/lib/store";

const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ArchiveCalendar({ days, today }: { days: string[]; today: string }) {
  const t = useTranslations();
  const format = useFormatter();
  const hydrated = useHydrated();
  const daily = useStore((s) => s.daily);
  const archive = useStore((s) => s.archive);

  // Agrupa por mês, do mais recente para o mais antigo.
  const months = new Map<string, string[]>();
  for (const d of days) {
    const key = d.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), d]);
  }
  const ordered = [...months.entries()].reverse();

  return (
    <div className="flex flex-col gap-10">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2" aria-hidden>
        <li className="flex items-center gap-2"><span className="size-3 rounded bg-good" />{t("archive.solved")}</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded bg-bad/80" />{t("archive.failed")}</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded bg-surface ring-1 ring-line" />{t("archive.notPlayed")}</li>
      </ul>
      {ordered.map(([month, list]) => {
        const offset = MONDAY_FIRST.indexOf(weekday(list[0]));
        return (
          <section key={month} className="max-w-xl">
            <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">
              {capitalize(format.dateTime(new Date(`${month}-15T12:00:00Z`), { month: "long", year: "numeric", timeZone: "UTC" }))}
            </h2>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-ink-2">
              {MONDAY_FIRST.map((w) => (
                <span key={w} className="pb-1">{t(`weekday.${w}`).slice(0, 3)}</span>
              ))}
              {Array.from({ length: offset }, (_, i) => <span key={`pad-${i}`} />)}
              {list.map((d) => {
                const rec = hydrated ? (daily[d] ?? archive[d]) : undefined;
                const isToday = d === today;
                const tone =
                  rec?.status === "solved"
                    ? "bg-good text-white"
                    : rec?.status === "failed"
                      ? "bg-bad/80 text-white"
                      : "bg-surface text-ink ring-1 ring-line hover:ring-brand";
                return (
                  <Link
                    key={d}
                    href={isToday ? "/" : `/arquivo/${d}`}
                    className={`flex aspect-square flex-col items-center justify-center rounded-xl transition ${tone} ${isToday ? "outline-2 outline-offset-2 outline-brand" : ""}`}
                    aria-label={`${t("daily.number", { n: dayNumber(d) })} · ${d}${rec ? ` · ${t(`archive.${rec.status}`)}` : ""}`}
                  >
                    <span className="font-display text-base font-bold sm:text-lg">{Number(d.slice(8))}</span>
                    <span className="hidden font-mono text-[10px] opacity-70 sm:block">#{dayNumber(d)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
