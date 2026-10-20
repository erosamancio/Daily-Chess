"use client";

import { defaultPieces } from "react-chessboard";
import { useTranslations } from "next-intl";

const OPTIONS = ["q", "r", "b", "n"] as const;

export function PromotionPicker({
  color,
  onPick,
  onCancel,
}: {
  color: "white" | "black";
  onPick: (piece: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("puzzle");
  const prefix = color === "white" ? "w" : "b";
  return (
    <div
      className="absolute inset-0 z-20 grid place-items-center bg-ink/40 backdrop-blur-[2px]"
      onClick={onCancel}
      role="dialog"
      aria-label={t("promoteTo")}
    >
      <div className="dc-rise rounded-2xl bg-surface p-3 shadow-card" onClick={(e) => e.stopPropagation()}>
        <p className="px-1 pb-2 text-sm font-medium text-ink-2">{t("promoteTo")}</p>
        <div className="flex gap-2">
          {OPTIONS.map((p) => {
            const Piece = defaultPieces[`${prefix}${p.toUpperCase()}`];
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPick(p)}
                className="size-16 rounded-xl bg-surface-2 p-1.5 transition hover:bg-line active:scale-95"
                aria-label={t(`pieces.${p}`)}
              >
                <Piece />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
