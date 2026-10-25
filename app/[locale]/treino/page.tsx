import { Chess } from "chess.js";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeList } from "@/components/train/ThemeList";
import { loadTheme } from "@/lib/data.server";
import { parseUci } from "@/lib/puzzle-engine";
import { THEMES } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "train" });
  return { title: t("title"), description: t("subtitle") };
}

function samplePosition(theme: (typeof THEMES)[number]) {
  const list = loadTheme(theme);
  const p = list.find((x) => x.rating >= 1150) ?? list[0];
  const chess = new Chess(p.fen);
  chess.move(parseUci(p.moves[0]));
  return { fen: chess.fen(), orientation: chess.turn() === "w" ? ("white" as const) : ("black" as const) };
}

export default async function TrainPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("train");
  const themes = THEMES.map((key) => ({ key, ...samplePosition(key), count: loadTheme(key).length }));

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-2">{t("subtitle")}</p>
      </header>
      <ThemeList themes={themes} />
    </div>
  );
}
