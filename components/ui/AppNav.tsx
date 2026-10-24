"use client";

import { CalendarDays, Dumbbell, Landmark, RotateCcw, Timer, User, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Wordmark } from "./Logo";

const ITEMS = [
  { href: "/", key: "today", icon: Sun },
  { href: "/treino", key: "train", icon: Dumbbell },
  { href: "/rush", key: "rush", icon: Timer },
  { href: "/classicos", key: "classics", icon: Landmark },
  { href: "/revisao", key: "review", icon: RotateCcw, desktopOnly: true },
  { href: "/arquivo", key: "archive", icon: CalendarDays, desktopOnly: true },
  { href: "/perfil", key: "profile", icon: User },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

export function SideNav() {
  const t = useTranslations("nav");
  const isActive = useActive();
  return (
    <nav className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line px-5 py-7 lg:flex" aria-label="Daily Chess">
      <Link href="/" className="px-2">
        <Wordmark />
      </Link>
      <ul className="flex flex-col gap-1">
        {ITEMS.map(({ href, key, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition ${
                  active ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BottomNav() {
  const t = useTranslations("nav");
  const isActive = useActive();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Daily Chess"
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.filter((i) => !("desktopOnly" in i)).map(({ href, key, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                  active ? "text-brand" : "text-ink-2"
                }`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-brand/12" : ""}`}>
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
