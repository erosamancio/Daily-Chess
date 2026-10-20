"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { MiniBoard } from "@/components/board/MiniBoard";
import { Link } from "@/i18n/navigation";
import { useHydrated, useStore } from "@/lib/store";
import type { ThemeKey } from "@/lib/types";

type Item = { key: ThemeKey; fen: string; orientation: "white" | "black"; count: number };

export function ThemeList({ themes }: { themes: Item[] }) {
  const t = useTranslations();
  const hydrated = useHydrated();
  const stats = useStore((s) => s.themeStats);
  const rating = useStore((s) => s.rating);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-ink-2">
        {t("train.yourRating", { rating: hydrated ? rating : "—" })}
      </p>
      <ul className="grid gap-x-8 gap-y-1 md:grid-cols-2">
        {themes.map(({ key, fen, orientation }) => {
          const stat = hydrated ? stats[key] : undefined;
          const rate = stat && stat.attempts ? stat.solved / stat.attempts : 0;
          return (
            <li key={key}>
              <Link
                href={`/treino/${key}`}
                className="group flex items-center gap-4 rounded-2xl px-2 py-3 transition hover:bg-surface"
              >
                <MiniBoard fen={fen} orientation={orientation} className="w-20 shrink-0 shadow-card sm:w-24" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-bold tracking-tight">{t(`themes.${key}.name`)}</h2>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-ink-2">{t(`themes.${key}.desc`)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                      <span className="block h-full rounded-full bg-good transition-all" style={{ width: `${rate * 100}%` }} />
                    </span>
                    <span className="text-xs font-medium text-ink-2 tabular">
                      {stat?.attempts ? t("train.solvedOf", stat) : t("train.notStarted")}
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-ink-2 transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
