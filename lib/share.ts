export type MoveMark = "clean" | "struggle" | "revealed";

const EMOJI: Record<MoveMark, string> = {
  clean: "🟩",
  struggle: "🟨",
  revealed: "🟥",
};

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function buildShareText(opts: {
  number: number;
  marks: MoveMark[];
  timeMs: number;
  streak: number;
  solved: boolean;
  url: string;
  level?: string;
}): string {
  const status = opts.solved ? "✅" : "❌";
  const lines = [
    `Daily Chess #${opts.number}${opts.level ? ` · ${opts.level}` : ""} ♟️ ${status}`,
    opts.marks.map((m) => EMOJI[m]).join(""),
    `⏱ ${formatTime(opts.timeMs)}${opts.streak > 1 ? ` · 🔥 ${opts.streak}` : ""}`,
    opts.url,
  ];
  return lines.join("\n");
}
