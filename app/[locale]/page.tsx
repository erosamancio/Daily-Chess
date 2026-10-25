import { setRequestLocale } from "next-intl/server";
import { DailyChallenge } from "@/components/puzzle/DailyChallenge";
import { getDailyLevels, getToday } from "@/lib/data.server";

export const revalidate = 60;

export default async function TodayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const entry = getToday();
  return <DailyChallenge entry={entry} levels={getDailyLevels(entry.date)} mode="today" />;
}
