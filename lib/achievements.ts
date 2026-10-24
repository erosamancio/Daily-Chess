import { CLASSICS } from "@/data/classics.source";
import type { DailyRecord } from "./streak";

/** Conquistas calculadas a partir do progresso salvo: nada extra para guardar ou sincronizar. */
export type AchievementInput = {
  daily: Record<string, DailyRecord>;
  archive: Record<string, DailyRecord>;
  dailyLevels: Record<string, Partial<Record<"easy" | "hard", DailyRecord>>>;
  bestStreak: number;
  rating: number;
  themeStats: Partial<Record<string, { attempts: number; solved: number }>>;
  rushBest: number;
  rushBest5: number;
  classicsSolved: string[];
  reviewCleared: number;
};

export type Achievement = { id: string; icon: string; done: boolean; progress: number; goal: number };

const solved = (r?: DailyRecord) => r?.status === "solved";
const clean = (r?: DailyRecord) => solved(r) && r!.mistakes === 0 && r!.hints === 0;

export function computeAchievements(s: AchievementInput): Achievement[] {
  const dailyDays = Object.values(s.daily).filter(solved).length;
  const cleanDays = Object.values(s.daily).filter(clean).length;
  const trained = Object.values(s.themeStats).reduce((n, t) => n + (t?.solved ?? 0), 0);
  const themesTried = Object.values(s.themeStats).filter((t) => t && t.attempts > 0).length;
  const tripleDays = Object.entries(s.dailyLevels).filter(([d, l]) => solved(l.easy) && solved(l.hard) && solved(s.daily[d] ?? s.archive[d])).length;
  const hardSolved = Object.values(s.dailyLevels).filter((l) => solved(l.hard)).length;
  const archiveDays = Object.values(s.archive).filter(solved).length;
  const classics = CLASSICS.length;

  const list: [string, string, number, number][] = [
    ["firstDaily", "☀️", dailyDays, 1],
    ["streak3", "🔥", s.bestStreak, 3],
    ["streak7", "🔥", s.bestStreak, 7],
    ["streak30", "🏆", s.bestStreak, 30],
    ["clean10", "✨", cleanDays, 10],
    ["triple", "🎯", tripleDays, 1],
    ["hard5", "🧠", hardSolved, 5],
    ["archive10", "📅", archiveDays, 10],
    ["train50", "💪", trained, 50],
    ["train250", "🏋️", trained, 250],
    ["explorer", "🧭", themesTried, 10],
    ["rating1500", "📈", s.rating, 1500],
    ["rating1800", "🚀", s.rating, 1800],
    ["rush15", "⏱️", Math.max(s.rushBest, s.rushBest5), 15],
    ["rush30", "⚡", Math.max(s.rushBest, s.rushBest5), 30],
    ["classics", "🏛️", s.classicsSolved.length, classics],
    ["review10", "🔁", s.reviewCleared, 10],
  ];
  return list.map(([id, icon, value, goal]) => ({ id, icon, done: value >= goal, progress: Math.min(value, goal), goal }));
}
