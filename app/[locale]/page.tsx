import { setRequestLocale } from "next-intl/server";
import { DailyChallenge } from "@/components/puzzle/DailyChallenge";
import { getToday } from "@/lib/data.server";

// O dia vira à meia-noite de Brasília; a página é regenerada a cada minuto.
export const revalidate = 60;

export default async function TodayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DailyChallenge entry={getToday()} mode="today" />;
}
