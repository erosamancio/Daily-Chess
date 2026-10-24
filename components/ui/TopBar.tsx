"use client";

import { Flame, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useHydrated, useStreak } from "@/lib/store";
import { Wordmark } from "./Logo";
import { SettingsSheet } from "./SettingsSheet";

export function StreakBadge() {
  const hydrated = useHydrated();
  const { current } = useStreak();
  const t = useTranslations("result");
  const active = hydrated && current > 0;
  return (
    <Link
      href="/perfil"
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold tabular transition ${
        active ? "bg-accent-soft text-ink" : "bg-surface-2 text-ink-2"
      }`}
      aria-label={`${t("streak")}: ${hydrated ? current : 0}`}
    >
      <Flame className={`size-4 ${active ? "fill-accent text-accent [animation:dc-flame_700ms_ease-in-out_2]" : ""}`} />
      {hydrated ? current : 0}
    </Link>
  );
}

export function TopBar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 lg:h-16 lg:px-8">
        <Link href="/" className="lg:hidden">
          <Wordmark />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <StreakBadge />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
            aria-label={t("settings")}
          >
            <Settings2 className="size-5" />
          </button>
        </div>
      </div>
      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
