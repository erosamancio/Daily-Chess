"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { todayKey } from "./daily";
import { INITIAL_RATING, updateRating } from "./rating";
import { computeStreak, type DailyRecord } from "./streak";
import type { DailyLevel, Puzzle, ThemeKey } from "./types";

export type BoardTheme = "green" | "wood" | "blue" | "slate";

type ThemeStat = { attempts: number; solved: number };

type State = {
  daily: Record<string, DailyRecord>;
  archive: Record<string, DailyRecord>;
  dailyLevels: Record<string, Partial<Record<Exclude<DailyLevel, "normal">, DailyRecord>>>;
  rating: number;
  ratingGames: number;
  themeStats: Partial<Record<ThemeKey, ThemeStat>>;
  seen: string[];
  rushBest: number;
  rushBest5: number;
  classicsSolved: string[];
  review: Puzzle[];
  reviewCleared: number;
  settings: { sound: boolean; boardTheme: BoardTheme; onboarded: boolean };

  recordDaily: (date: string, record: DailyRecord) => void;
  recordArchive: (date: string, record: DailyRecord) => void;
  recordDailyLevel: (date: string, level: Exclude<DailyLevel, "normal">, record: DailyRecord) => void;
  reset: () => void;
  recordTraining: (opts: { id: string; theme: ThemeKey; puzzleRating: number; success: boolean }) => void;
  recordRush: (score: number, minutes?: 3 | 5) => void;
  addReview: (puzzle: Puzzle) => void;
  clearReview: (id: string) => void;
  importBackup: (data: unknown) => boolean;
  recordClassic: (slug: string) => void;
  updateSettings: (patch: Partial<State["settings"]>) => void;
};

const REVIEW_MAX = 60;
const BACKUP_KIND = "daily-chess-backup";

type Saved = Partial<Omit<State, `record${string}` | "reset" | "updateSettings" | "addReview" | "clearReview" | "importBackup">>;

export function exportBackup(): string {
  const { state } = JSON.parse(localStorage.getItem("daily-chess") ?? "{}") as { state?: Saved };
  return JSON.stringify({ kind: BACKUP_KIND, version: 1, exportedAt: new Date().toISOString(), state: state ?? {} }, null, 2);
}

function parseBackup(data: unknown): Saved | null {
  if (!data || typeof data !== "object") return null;
  const { kind, state } = data as { kind?: unknown; state?: unknown };
  if (kind !== BACKUP_KIND || !state || typeof state !== "object") return null;
  const s = state as Record<string, unknown>;
  const isObj = (v: unknown) => v === undefined || (typeof v === "object" && v !== null && !Array.isArray(v));
  const isNum = (v: unknown) => v === undefined || (typeof v === "number" && Number.isFinite(v));
  const isArr = (v: unknown) => v === undefined || Array.isArray(v);
  const ok =
    ["daily", "archive", "dailyLevels", "themeStats", "settings"].every((k) => isObj(s[k])) &&
    ["rating", "ratingGames", "rushBest", "rushBest5", "reviewCleared"].every((k) => isNum(s[k])) &&
    ["seen", "classicsSolved", "review"].every((k) => isArr(s[k]));
  if (!ok) return null;
  const allowed = ["daily", "archive", "dailyLevels", "themeStats", "settings", "rating", "ratingGames", "rushBest", "rushBest5", "reviewCleared", "seen", "classicsSolved", "review"];
  return Object.fromEntries(Object.entries(s).filter(([k]) => allowed.includes(k))) as Saved;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      daily: {},
      archive: {},
      dailyLevels: {},
      rating: INITIAL_RATING,
      ratingGames: 0,
      themeStats: {},
      seen: [],
      rushBest: 0,
      rushBest5: 0,
      classicsSolved: [],
      review: [],
      reviewCleared: 0,
      settings: { sound: true, boardTheme: "green", onboarded: false },

      recordDaily: (date, record) =>
        set((s) => (s.daily[date] ? s : { daily: { ...s.daily, [date]: record } })),

      recordArchive: (date, record) =>
        set((s) => (s.daily[date] || s.archive[date] ? s : { archive: { ...s.archive, [date]: record } })),

      recordDailyLevel: (date, level, record) =>
        set((s) =>
          s.dailyLevels[date]?.[level] ? s : { dailyLevels: { ...s.dailyLevels, [date]: { ...s.dailyLevels[date], [level]: record } } },
        ),

      reset: () =>
        set((s) => ({
          daily: {},
          archive: {},
          dailyLevels: {},
          rating: INITIAL_RATING,
          ratingGames: 0,
          themeStats: {},
          seen: [],
          rushBest: 0,
          rushBest5: 0,
          classicsSolved: [],
          review: [],
          reviewCleared: 0,
          settings: { ...s.settings, onboarded: false },
        })),

      recordTraining: ({ id, theme, puzzleRating, success }) =>
        set((s) => {
          const stat = s.themeStats[theme] ?? { attempts: 0, solved: 0 };
          return {
            rating: updateRating(s.rating, puzzleRating, success, s.ratingGames),
            ratingGames: s.ratingGames + 1,
            themeStats: {
              ...s.themeStats,
              [theme]: { attempts: stat.attempts + 1, solved: stat.solved + (success ? 1 : 0) },
            },
            seen: [...s.seen.filter((x) => x !== id), id].slice(-600),
          };
        }),

      recordRush: (score, minutes = 3) =>
        set((s) => (minutes === 5 ? { rushBest5: Math.max(s.rushBest5, score) } : { rushBest: Math.max(s.rushBest, score) })),

      addReview: (puzzle) =>
        set((s) => ({ review: [...s.review.filter((p) => p.id !== puzzle.id), puzzle].slice(-REVIEW_MAX) })),

      clearReview: (id) =>
        set((s) => (s.review.some((p) => p.id === id) ? { review: s.review.filter((p) => p.id !== id), reviewCleared: s.reviewCleared + 1 } : s)),

      importBackup: (data) => {
        const state = parseBackup(data);
        if (!state) return false;
        set(state);
        return true;
      },

      recordClassic: (slug) =>
        set((s) => (s.classicsSolved.includes(slug) ? s : { classicsSolved: [...s.classicsSolved, slug] })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: "daily-chess",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return useStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

export function useStreak() {
  const daily = useStore((s) => s.daily);
  return computeStreak(daily, todayKey());
}
