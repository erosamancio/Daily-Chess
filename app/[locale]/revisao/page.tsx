import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReviewSession } from "@/components/train/ReviewSession";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "review" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function ReviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReviewSession />;
}
