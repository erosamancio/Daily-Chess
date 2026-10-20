import { addDays } from "./daily";

export type DailyRecord = {
  status: "solved" | "failed";
  mistakes: number;
  hints: number;
  timeMs: number;
  marks: ("clean" | "struggle" | "revealed")[];
};

/**
 * Streak = dias consecutivos resolvidos terminando hoje (ou ontem, se hoje ainda
 * não foi jogado — o streak só quebra quando um dia inteiro passa).
 */
export function computeStreak(records: Record<string, DailyRecord>, today: string) {
  const solved = (d: string) => records[d]?.status === "solved";
  let cursor = solved(today) ? today : addDays(today, -1);
  let current = 0;
  while (solved(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const days = Object.keys(records).filter(solved).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best: Math.max(best, current) };
}
