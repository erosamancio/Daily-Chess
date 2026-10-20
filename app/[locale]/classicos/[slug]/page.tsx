import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ClassicPlayer } from "@/components/classics/ClassicPlayer";
import { getClassic, getClassics } from "@/lib/classics";

export function generateStaticParams() {
  return getClassics().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const c = getClassic(slug);
  if (!c) return {};
  const lang = locale === "en" ? "en" : "pt";
  return { title: c.title[lang], description: c.story[lang] };
}

export default async function ClassicPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const classic = getClassic(slug);
  if (!classic) notFound();
  setRequestLocale(locale);
  const lang = locale === "en" ? "en" : "pt";
  return (
    <ClassicPlayer
      classic={{
        slug: classic.slug,
        fen: classic.fen,
        moves: classic.moves,
        history: classic.history,
        title: classic.title[lang],
        story: classic.story[lang],
        white: classic.white,
        black: classic.black,
        event: classic.event,
        year: classic.year,
        difficulty: classic.difficulty,
        mate: classic.mate,
      }}
    />
  );
}
