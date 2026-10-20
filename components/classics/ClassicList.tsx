"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MiniBoard } from "@/components/board/MiniBoard";
import { Link } from "@/i18n/navigation";
import { useHydrated, useStore } from "@/lib/store";

type Item = {
  slug: string;
  fen: string;
  orientation: "white" | "black";
  title: string;
  players: string;
  year: number;
  difficulty: 1 | 2 | 3;
};

export function ClassicList({ items }: { items: Item[] }) {
  const t = useTranslations("classics");
  const hydrated = useHydrated();
  const solved = useStore((s) => s.classicsSolved);

  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => {
        const done = hydrated && solved.includes(c.slug);
        return (
          <li key={c.slug}>
            <Link href={`/classicos/${c.slug}`} className="group flex flex-col gap-3">
              <div className="relative">
                <MiniBoard fen={c.fen} orientation={c.orientation} className="shadow-card transition duration-300 group-hover:-translate-y-1" />
                {done && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white shadow-card">
                    <CheckCircle2 className="size-3.5" /> {t("solved")}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-xl font-bold tracking-tight group-hover:text-brand">{c.title}</h2>
                  <span className="font-mono text-sm text-ink-2 tabular">{c.year}</span>
                </div>
                <p className="mt-0.5 text-sm text-ink-2">{c.players}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ink-2">
                  <span className="flex gap-0.5" aria-hidden>
                    {[1, 2, 3].map((n) => (
                      <span key={n} className={`h-2.5 w-1.5 rounded-sm ${n <= c.difficulty ? "bg-brand" : "bg-line"}`} />
                    ))}
                  </span>
                  {t(`difficulty.${c.difficulty}`)}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
