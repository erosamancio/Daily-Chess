export const DAILY_TIMEZONE = "America/Sao_Paulo";
export const LAUNCH_DATE = "2026-10-01";

const DAY_MS = 86_400_000;

export function todayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtcMs(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function dayNumber(dateKey: string): number {
  return Math.round((toUtcMs(dateKey) - toUtcMs(LAUNCH_DATE)) / DAY_MS) + 1;
}

export function dateFromNumber(n: number): string {
  return new Date(toUtcMs(LAUNCH_DATE) + (n - 1) * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(dateKey: string, delta: number): string {
  return new Date(toUtcMs(dateKey) + delta * DAY_MS).toISOString().slice(0, 10);
}

export function weekday(dateKey: string): number {
  return new Date(toUtcMs(dateKey)).getUTCDay();
}

export function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && dateFromNumber(dayNumber(value)) === value;
}

export const WEEKDAY_RATING: Record<number, [number, number]> = {
  1: [800, 1100],
  2: [1000, 1300],
  3: [1200, 1500],
  4: [1400, 1700],
  5: [1600, 1900],
  6: [1800, 2100],
  0: [2000, 2400],
};
