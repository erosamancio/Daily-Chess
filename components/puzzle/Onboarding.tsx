"use client";

import { CalendarHeart, Flame, MousePointerClick } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useStore } from "@/lib/store";

const STEPS = [
  { key: "s1", icon: CalendarHeart },
  { key: "s2", icon: MousePointerClick },
  { key: "s3", icon: Flame },
] as const;

export function Onboarding() {
  const t = useTranslations("onboarding");
  const update = useStore((s) => s.updateSettings);
  const [step, setStep] = useState(0);
  const done = () => update({ onboarded: true });
  const { key, icon: Icon } = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 backdrop-blur-[3px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onb-title"
        className="w-full max-w-md rounded-t-3xl bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-card sm:rounded-3xl"
      >
        <div key={step} className="dc-rise">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand text-brand-ink">
            <Icon className="size-7" strokeWidth={2.2} />
          </span>
          <h2 id="onb-title" className="mt-5 font-display text-3xl font-extrabold tracking-tight">
            {t(`${key}Title`)}
          </h2>
          <p className="mt-2 leading-relaxed text-ink-2">{t(`${key}Body`)}</p>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.key} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-brand" : "w-1.5 bg-line"}`} />
            ))}
          </div>
          {!last && (
            <button type="button" onClick={done} className="ml-auto h-11 px-3 text-sm font-semibold text-ink-2 hover:text-ink">
              {t("skip")}
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? done() : setStep(step + 1))}
            className={`${last ? "ml-auto" : ""} h-12 rounded-full bg-brand px-6 font-semibold text-brand-ink transition hover:bg-brand-2 active:scale-[0.98]`}
            autoFocus
          >
            {last ? t("start") : t("next")}
          </button>
        </div>
      </div>
    </div>
  );
}
