"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BOARD_THEMES } from "@/components/board/boardThemes";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useStore, type BoardTheme } from "@/lib/store";

type Appearance = "system" | "light" | "dark";

function readAppearance(): Appearance {
  try {
    const v = localStorage.getItem("dc-theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function applyAppearance(value: Appearance) {
  try {
    if (value === "system") localStorage.removeItem("dc-theme");
    else localStorage.setItem("dc-theme", value);
  } catch {}
  if (value === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = value;
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 flex-1 rounded-lg px-2 text-sm font-semibold transition ${
            value === o.value ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("settings");
  const tc = useTranslations("result");
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [appearance, setAppearance] = useState<Appearance>("system");

  useEffect(() => {
    if (!open) return;
    setAppearance(readAppearance());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
        className="dc-rise w-full max-w-md rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-card sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="settings-title" className="font-display text-xl font-bold">
            {t("title")}
          </h2>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-surface-2" aria-label={tc("close")}>
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-ink-2">{t("board")}</h3>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t("board")}>
              {(Object.keys(BOARD_THEMES) as BoardTheme[]).map((key) => {
                const c = BOARD_THEMES[key];
                const active = settings.boardTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ boardTheme: key })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-2 text-xs font-semibold transition ${
                      active ? "bg-brand/10 text-ink ring-2 ring-brand" : "text-ink-2 hover:bg-surface-2"
                    }`}
                  >
                    <span className="grid size-10 grid-cols-2 overflow-hidden rounded-md">
                      <span style={{ background: c.light }} />
                      <span style={{ background: c.dark }} />
                      <span style={{ background: c.dark }} />
                      <span style={{ background: c.light }} />
                    </span>
                    {t(`boards.${key}`)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-ink-2">{t("theme")}</h3>
            <Segmented
              label={t("theme")}
              value={appearance}
              onChange={(v) => {
                setAppearance(v);
                applyAppearance(v);
              }}
              options={(["system", "light", "dark"] as const).map((v) => ({ value: v, label: t(`themes.${v}`) }))}
            />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-ink-2">{t("language")}</h3>
            <Segmented
              label={t("language")}
              value={locale}
              onChange={(v) => router.replace(pathname, { locale: v })}
              options={[
                { value: "pt", label: "Português" },
                { value: "en", label: "English" },
              ]}
            />
          </section>

          <label className="flex h-12 cursor-pointer items-center justify-between rounded-xl bg-surface-2 px-4">
            <span className="font-semibold">{t("sound")}</span>
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(e) => update({ sound: e.target.checked })}
              className="peer sr-only"
            />
            <span className="relative h-7 w-12 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-brand after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
          </label>
        </div>
      </div>
    </div>,
    document.body,
  );
}
