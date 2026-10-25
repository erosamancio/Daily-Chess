"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { PuzzleBoard, type PuzzleOutcome } from "@/components/board/PuzzleBoard";
import { Link } from "@/i18n/navigation";
import { useStore } from "@/lib/store";

type Props = {
  classic: {
    slug: string;
    fen: string;
    moves: string[];
    history: string[];
    title: string;
    story: string;
    white: string;
    black: string;
    event: string;
    year: number;
    difficulty: 1 | 2 | 3;
    mate: boolean;
  };
};

function MoveList({ history }: { history: string[] }) {
  const pairs: string[][] = [];
  for (let i = 0; i < history.length; i += 2) pairs.push(history.slice(i, i + 2));
  return (
    <ol className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[13px] leading-relaxed text-ink-2">
      {pairs.map((p, i) => (
        <li key={i}>
          <span className="text-ink-2/60">{i + 1}.</span> {p.join(" ")}
        </li>
      ))}
      <li className="font-semibold text-brand">{history.length % 2 === 0 ? `${pairs.length + 1}. ?` : "…?"}</li>
    </ol>
  );
}

export function ClassicPlayer({ classic }: Props) {
  const t = useTranslations();
  const recordClassic = useStore((s) => s.recordClassic);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<PuzzleOutcome | null>(null);
  const toMove = classic.fen.split(" ")[1] === "w" ? "white" : "black";
  const playerMoves = Math.ceil(classic.moves.length / 2);

  const onFinish = useCallback(
    (o: PuzzleOutcome) => {
      setOutcome(o);
      if (o.solved) recordClassic(classic.slug);
    },
    [classic.slug, recordClassic],
  );

  const goal = classic.mate ? t("puzzle.findMate", { n: playerMoves }) : t("puzzle.findBest");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-10">
      <div className="min-w-0">
        <PuzzleBoard
          puzzle={{ fen: classic.fen, moves: classic.moves, opponentFirst: false }}
          puzzleKey={`${classic.slug}-${attempt}`}
          goal={goal}
          onFinish={onFinish}
        />
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        <Link href="/classicos" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" /> {t("classics.back")}
        </Link>
        <header>
          <h1 className="font-display text-4xl font-extrabold leading-[1] tracking-tight text-balance lg:text-5xl">{classic.title}</h1>
          {classic.white !== "—" && (
            <p className="mt-3 text-lg font-medium">
              {classic.white} <span className="text-ink-2">×</span> {classic.black}
            </p>
          )}
          <p className="mt-1 text-ink-2 tabular">
            {classic.event} · {classic.year}
          </p>
          <p className="mt-2 text-sm font-semibold text-brand">
            {t("classics.youPlay", { color: t(`classics.${toMove}`) })}
          </p>
        </header>

        {outcome && (
          <section className="dc-rise flex items-center justify-between gap-3 rounded-3xl bg-surface p-5 shadow-card ring-1 ring-line/60" aria-live="polite">
            <h2 className={`font-display text-2xl font-extrabold ${outcome.solved ? "text-good" : ""}`}>
              {outcome.solved ? t("puzzle.solved") : t("puzzle.revealed")}
            </h2>
            <button
              type="button"
              onClick={() => {
                setOutcome(null);
                setAttempt((n) => n + 1);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-semibold hover:bg-line"
            >
              <RotateCcw className="size-4" /> {t("puzzle.retry")}
            </button>
          </section>
        )}

        <section>
          <h2 className="font-display text-lg font-bold">{t("classics.story")}</h2>
          <p className="mt-2 max-w-prose leading-relaxed text-ink-2">{classic.story}</p>
        </section>

        <section className="rounded-2xl border border-line p-4">
          <MoveList history={classic.history} />
        </section>
      </aside>
    </div>
  );
}
