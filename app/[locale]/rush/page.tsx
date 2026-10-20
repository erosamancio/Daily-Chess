import { getTranslations, setRequestLocale } from "next-intl/server";
import { RushGame } from "@/components/rush/RushGame";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rush" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function RushPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RushGame />;
}
