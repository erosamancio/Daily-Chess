"use client";

import { Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, type ChangeEvent } from "react";
import { computeAchievements } from "@/lib/achievements";
import { addDays, todayKey, weekday } from "@/lib/daily";
import { exportBackup, useHydrated, useStore, useStreak } from "@/lib/store";
import { THEMES } from "@/lib/types";

const WEEKS = 18;

function Heatmap() {
  const t = useTranslations();
  const daily = useStore((s) => s.daily);
  const archive = useStore((s) => s.archive);
  const today = todayKey();
  // Colunas = semanas (segunda a domingo), terminando na semana atual.
  const thisMonday = addDays(today, -((weekday(today) + 6) % 7));
  const start = addDays(thisMonday, -(WEEKS - 1) * 7);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img" aria-label={t("profile.calendar")}>
        {Array.from({ length: WEEKS * 7 }, (_, i) => {
          const d = addDays(start, i);
          const rec = daily[d] ?? archive[d];
          const future = d > today;
          const tone = future
            ? "bg-transparent"
            : rec?.status === "solved"
              ? rec.mistakes === 0 && rec.hints === 0
                ? "bg-good"
                : "bg-good/55"
              : rec?.status === "failed"
                ? "bg-bad/70"
                : "bg-line/70";
          return <span key={d} title={d} className={`size-3.5 rounded-[4px] sm:size-4 ${tone} ${d === today ? "ring-2 ring-brand ring-offset-1 ring-offset-surface" : ""}`} />;
        })}
      </div>
    </div>
  );
}

function Backup() {
  const t = useTranslations("backup");
  const importBackup = useStore((s) => s.importBackup);
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"saved" | "restored" | "invalid" | null>(null);

  const download = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-chess-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("saved");
  };

  const restore = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!window.confirm(t("confirm"))) return;
      setStatus(importBackup(data) ? "restored" : "invalid");
    } catch {
      setStatus("invalid");
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-5 ring-1 ring-line/60 sm:p-6 lg:w-fit">
      <div>
        <h2 className="font-display text-xl font-bold">{t("title")}</h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-2">{t("body")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={download} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink transition hover:bg-brand-2">
          <Download className="size-4" /> {t("download")}
        </button>
        <button type="button" onClick={() => input.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-5 text-sm font-semibold transition hover:bg-line">
          <Upload className="size-4" /> {t("restore")}
        </button>
        <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={restore} />
      </div>
      {status && (
        <p role="status" className={`text-sm font-semibold ${status === "invalid" ? "text-bad" : "text-good"}`}>
          {t(status)}
        </p>
      )}
    </section>
  );
}

export function Profile() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const s = useStore();
  const streak = useStreak();

  if (!hydrated) return <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />;

  const solvedDaily = Object.values(s.daily).filter((r) => r.status === "solved").length;
  const big = [
    { label: t("profile.rating"), value: s.rating },
    { label: t("profile.streak"), value: streak.current },
    { label: t("profile.bestStreak"), value: streak.best },
    { label: t("profile.dailySolved"), value: solvedDaily },
    { label: t("profile.rushBest"), value: `${s.rushBest} · ${s.rushBest5}` },
  ];
  const achievements = computeAchievements({ ...s, bestStreak: streak.best });
  const unlocked = achievements.filter((a) => a.done).length;

  return (
    <div className="flex flex-col gap-10">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-5">
        {big.map((b, i) => (
          <div key={b.label} className={i === 0 ? "col-span-2 sm:col-span-1" : ""}>
            <dt className="text-sm font-medium text-ink-2">{b.label}</dt>
            <dd className={`font-display font-extrabold tracking-tight tabular ${i === 0 ? "text-6xl text-brand" : "text-4xl"}`}>{b.value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-3xl bg-surface p-5 ring-1 ring-line/60 sm:p-6 lg:w-fit">
        <h2 className="mb-4 font-display text-xl font-bold">{t("profile.calendar")}</h2>
        <Heatmap />
        {solvedDaily === 0 && <p className="mt-4 text-sm text-ink-2">{t("profile.empty")}</p>}
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-bold">{t("achievements.title")}</h2>
          <span className="text-sm font-semibold text-ink-2 tabular">
            {unlocked}/{achievements.length}
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <li
              key={a.id}
              className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ${a.done ? "bg-surface ring-line/60" : "bg-transparent ring-line/50"}`}
            >
              <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-xl text-2xl ${a.done ? "bg-accent-soft" : "bg-surface-2 grayscale opacity-50"}`}>
                {a.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${a.done ? "" : "text-ink-2"}`}>
                  {t(`achievements.${a.id}.name`)}
                  <span className="sr-only">{a.done ? ` (${t("achievements.unlocked")})` : ""}</span>
                </p>
                <p className="text-xs leading-snug text-ink-2">{t(`achievements.${a.id}.desc`, { n: a.goal })}</p>
                {!a.done && a.goal > 1 && (
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line/70" aria-label={`${a.progress}/${a.goal}`}>
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${(a.progress / a.goal) * 100}%` }} />
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">{t("profile.byTheme")}</h2>
        <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {THEMES.map((key) => {
            const stat = s.themeStats[key];
            const rate = stat?.attempts ? stat.solved / stat.attempts : 0;
            return (
              <li key={key} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">{t(`themes.${key}.name`)}</span>
                  <span className="text-ink-2 tabular">{stat?.attempts ? `${Math.round(rate * 100)}% · ${stat.attempts}` : "—"}</span>
                </div>
                <span className="h-2 overflow-hidden rounded-full bg-line/70">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${rate * 100}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <Backup />

      <div className="flex flex-col items-start gap-2 border-t border-line pt-6">
        <p className="text-sm text-ink-2">{t("profile.local")}</p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t("profile.resetConfirm"))) s.reset();
          }}
          className="h-10 rounded-full px-4 text-sm font-semibold text-bad ring-1 ring-bad/40 transition hover:bg-bad-soft"
        >
          {t("profile.reset")}
        </button>
      </div>
    </div>
  );
}
