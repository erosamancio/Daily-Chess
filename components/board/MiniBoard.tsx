"use client";

import { useStore } from "@/lib/store";
import { BOARD_THEMES } from "./boardThemes";

export function MiniBoard({
  fen,
  orientation = "white",
  notation = false,
  className = "",
}: {
  fen: string;
  orientation?: "white" | "black";
  notation?: boolean;
  className?: string;
}) {
  const theme = BOARD_THEMES[useStore((s) => s.settings.boardTheme)];
  const rows = fen.split(" ")[0].split("/");
  const grid: (string | null)[][] = rows.map((row) => {
    const out: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) out.push(...Array(Number(ch)).fill(null));
      else out.push(ch);
    }
    return out;
  });
  const ordered = orientation === "white" ? grid : grid.map((r) => [...r].reverse()).reverse();
  const files = orientation === "white" ? "abcdefgh" : "hgfedcba";

  return (
    <div className={`grid aspect-square grid-cols-8 overflow-hidden rounded-lg ${className}`} aria-hidden>
      {ordered.flatMap((row, r) =>
        row.map((piece, c) => {
          const light = (r + c) % 2 === 0;
          const code = piece ? (piece === piece.toUpperCase() ? "w" : "b") + piece.toUpperCase() : null;
          const ink = light ? theme.lightInk : theme.darkInk;
          const rank = orientation === "white" ? 8 - r : r + 1;
          return (
            <div key={`${r}-${c}`} style={{ background: light ? theme.light : theme.dark }} className="relative">
              {notation && c === 0 && (
                <span className="absolute top-[3%] left-[4%] text-[11px] font-semibold" style={{ color: ink }}>
                  {rank}
                </span>
              )}
              {notation && r === 7 && (
                <span className="absolute right-[4%] bottom-[2%] text-[11px] font-semibold" style={{ color: ink }}>
                  {files[c]}
                </span>
              )}
              {code && <div className={`dc-piece-static pc-${code}`} />}
            </div>
          );
        }),
      )}
    </div>
  );
}
