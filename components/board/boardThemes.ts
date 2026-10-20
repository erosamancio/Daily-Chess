import type { BoardTheme } from "@/lib/store";

export const BOARD_THEMES: Record<BoardTheme, { light: string; dark: string; lightInk: string; darkInk: string }> = {
  green: { light: "#e9ecd6", dark: "#6f9a5f", lightInk: "#5c7f4e", darkInk: "#eef1dc" },
  wood: { light: "#f0dab5", dark: "#b3855f", lightInk: "#9b6f4c", darkInk: "#f5e3c6" },
  blue: { light: "#dfe5e8", dark: "#7c9aab", lightInk: "#6a8798", darkInk: "#eef2f4" },
  slate: { light: "#cfd5d6", dark: "#5f6f77", lightInk: "#55646b", darkInk: "#e3e8e9" },
};
