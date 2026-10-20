"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { todayKey } from "./daily";
import { INITIAL_RATING, updateRating } from "./rating";
import { computeStreak, type DailyRecord } from "./streak";
import type { ThemeKey } from "./types";

export type BoardTheme = "green" | "wood" | "blue" | "slate";

type ThemeStat = { attempts: number; solved: number };

type State = {
  daily: Record<string, DailyRecord>;
  /** Dias anteriores jogados pelo Arquivo (não contam para a sequência). */
  archive: Record<string, DailyRecord>;
  rating: number;
  ratingGames: number;
  themeStats: Partial<Record<ThemeKey, ThemeStat>>;
  /** Puzzles de treino já vistos (últimos 600), para evitar repetição. */
  seen: string[];
  rushBest: number;
  classicsSolved: string[];
  settings: { sound: boolean; boardTheme: BoardTheme; onboarded: boolean };

  recordDaily: (date: string, record: DailyRecord) => void;
  recordArchive: (date: string, record: DailyRecord) => void;
  reset: () => void;
  recordTraining: (opts: { id: string; theme: ThemeKey; puzzleRating: number; success: boolean }) => void;
  recordRush: (score: number) => void;
  recordClassic: (slug: string) => void;
  updateSettings: (patch: Partial<State["settings"]>) => void;
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      daily: {},
      archive: {},
      rating: INITIAL_RATING,
      ratingGames: 0,
      themeStats: {},
      seen: [],
      rushBest: 0,
      classicsSolved: [],
      settings: { sound: true, boardTheme: "green", onboarded: false },

      recordDaily: (date, record) =>
        set((s) => (s.daily[date] ? s : { daily: { ...s.daily, [date]: record } })),

      recordArchive: (date, record) =>
        set((s) => (s.daily[date] || s.archive[date] ? s : { archive: { ...s.archive, [date]: record } })),

      reset: () =>
        set((s) => ({
          daily: {},
          archive: {},
          rating: INITIAL_RATING,
          ratingGames: 0,
          themeStats: {},
          seen: [],
          rushBest: 0,
          classicsSolved: [],
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

      recordRush: (score) => set((s) => ({ rushBest: Math.max(s.rushBest, score) })),

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

/** true depois que o estado salvo no navegador foi carregado (evita mismatch de hidratação). */
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
