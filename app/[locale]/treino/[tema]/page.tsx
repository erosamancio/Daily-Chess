import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrainingSession } from "@/components/train/TrainingSession";
import { isTheme, THEMES } from "@/lib/types";

export function generateStaticParams() {
  return THEMES.map((tema) => ({ tema }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; tema: string }> }) {
  const { locale, tema } = await params;
  if (!isTheme(tema)) return {};
  const t = await getTranslations({ locale, namespace: "themes" });
  return { title: t(`${tema}.name`), description: t(`${tema}.desc`) };
}

export default async function ThemePage({ params }: { params: Promise<{ locale: string; tema: string }> }) {
  const { locale, tema } = await params;
  if (!isTheme(tema)) notFound();
  setRequestLocale(locale);
  return <TrainingSession theme={tema} />;
}
