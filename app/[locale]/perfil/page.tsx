import { getTranslations, setRequestLocale } from "next-intl/server";
import { Profile } from "@/components/stats/Profile";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: t("title") };
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile");
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
      <Profile />
    </div>
  );
}
