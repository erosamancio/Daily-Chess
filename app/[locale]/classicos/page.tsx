import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClassicList } from "@/components/classics/ClassicList";
import { getClassics } from "@/lib/classics";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "classics" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function ClassicsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("classics");
  const lang = locale === "en" ? "en" : "pt";
  const items = getClassics()
    .map((c) => ({
      slug: c.slug,
      fen: c.fen,
      orientation: c.fen.split(" ")[1] === "w" ? ("white" as const) : ("black" as const),
      title: c.title[lang],
      players: c.white === "—" ? c.event : `${c.white} × ${c.black}`,
      year: c.year,
      difficulty: c.difficulty,
    }))
    .sort((a, b) => a.difficulty - b.difficulty || a.year - b.year);

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-2">{t("subtitle")}</p>
      </header>
      <ClassicList items={items} />
    </div>
  );
}
