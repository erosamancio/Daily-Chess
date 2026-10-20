import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { dayNumber, todayKey, weekday } from "@/lib/daily";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const today = todayKey();
  const wd = weekday(today);

  // Faixa de tabuleiro decorativa à direita.
  const squares = Array.from({ length: 64 }, (_, i) => ((Math.floor(i / 8) + i) % 2 === 0 ? "#e9ecd6" : "#6f9a5f"));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1e5a42", color: "#f0f7f2" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, width: 660 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 700 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#f0f7f2", display: "flex", flexWrap: "wrap", padding: 8 }}>
              <div style={{ width: 20, height: 20, background: "#1e5a42", borderRadius: 4 }} />
              <div style={{ width: 20, height: 20, background: "#d98e2a", borderRadius: 4 }} />
              <div style={{ width: 20, height: 20, background: "#f0f7f2" }} />
              <div style={{ width: 20, height: 20, background: "#1e5a42", borderRadius: 4 }} />
            </div>
            Daily Chess
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 34, opacity: 0.8 }}>{t("daily.number", { n: dayNumber(today) })}</div>
            <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>{t("daily.title")}</div>
            <div style={{ display: "flex", marginTop: 20 }}>
              <div style={{ background: "#d98e2a", color: "#132019", borderRadius: 999, padding: "10px 26px", fontSize: 30, fontWeight: 700 }}>
                {`${t(`weekday.${wd}`)} · ${t(`level.${wd}`)}`}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", width: 540, height: 540, marginTop: 45, borderRadius: 24, overflow: "hidden" }}>
          {squares.map((c, i) => (
            <div key={i} style={{ width: 67.5, height: 67.5, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
