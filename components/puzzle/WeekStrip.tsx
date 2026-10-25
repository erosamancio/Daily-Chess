"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { addDays, weekday } from "@/lib/daily";
import { useHydrated, useStore } from "@/lib/store";

export function WeekStrip({ today }: { today: string }) {
  const t = useTranslations();
  const hydrated = useHydrated();
  const daily = useStore((s) => s.daily);
  const wd = weekday(today);
  const monday = addDays(today, -((wd + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <figure className="flex flex-col gap-3">
      <ol className="grid grid-cols-7 items-end gap-1.5" aria-label={t("daily.weekCurve")}>
        {days.map((d, i) => {
          const rec = hydrated ? daily[d] : undefined;
          const isToday = d === today;
          const future = d > today;
          const height = 18 + i * 7;
          const dayIdx = weekday(d);
          return (
            <li key={d} className="flex flex-col items-center gap-1.5">
              <span
                className={`relative grid w-full place-items-center rounded-md transition-colors ${
                  rec?.status === "solved"
                    ? "bg-good text-white"
                    : rec?.status === "failed"
                      ? "bg-bad/80 text-white"
                      : isToday
                        ? "bg-brand/25 ring-2 ring-brand ring-inset"
                        : future
                          ? "bg-surface-2"
                          : "bg-line"
                }`}
                style={{ height }}
                title={`${t(`weekday.${dayIdx}`)} · ${t(`level.${dayIdx}`)}`}
              >
                {rec?.status === "solved" && <Check className="size-3.5" strokeWidth={3} />}
                {rec?.status === "failed" && <X className="size-3.5" strokeWidth={3} />}
              </span>
              <span className={`text-[11px] font-semibold ${isToday ? "font-bold text-brand" : "text-ink-2"}`}>
                {isToday ? t("daily.today") : t(`weekday.${dayIdx}`).slice(0, 3)}
              </span>
            </li>
          );
        })}
      </ol>
      <figcaption className="text-xs leading-relaxed text-ink-2">{t("daily.weekCurve")}</figcaption>
    </figure>
  );
}
