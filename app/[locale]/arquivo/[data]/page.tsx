import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DailyChallenge } from "@/components/puzzle/DailyChallenge";
import { redirect } from "@/i18n/navigation";
import { getDaily, getDailyLevels } from "@/lib/data.server";
import { isValidDateKey, todayKey } from "@/lib/daily";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; data: string }> }) {
  const { locale, data } = await params;
  const t = await getTranslations({ locale, namespace: "archive" });
  return { title: t("pastDay", { date: data }) };
}

export default async function ArchiveDayPage({ params }: { params: Promise<{ locale: string; data: string }> }) {
  const { locale, data } = await params;
  setRequestLocale(locale);
  if (data === todayKey()) redirect({ href: "/", locale });
  if (!isValidDateKey(data)) notFound();
  const entry = getDaily(data);
  if (!entry) notFound();
  return <DailyChallenge entry={entry} levels={getDailyLevels(data)} mode="archive" />;
}
