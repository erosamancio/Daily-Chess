import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveCalendar } from "@/components/stats/ArchiveCalendar";
import { addDays, dayNumber, LAUNCH_DATE, todayKey } from "@/lib/daily";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "archive" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function ArchivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("archive");
  const today = todayKey();
  const days = Array.from({ length: dayNumber(today) }, (_, i) => addDays(LAUNCH_DATE, i));

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-2">{t("subtitle")}</p>
      </header>
      <ArchiveCalendar days={days} today={today} />
    </div>
  );
}
