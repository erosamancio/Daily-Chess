import { NextResponse, type NextRequest } from "next/server";
import { getRush, getTraining } from "@/lib/data.server";
import { isTheme } from "@/lib/types";

export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  if (params.get("mode") === "rush") {
    const count = Math.min(120, Math.max(10, Number(params.get("count")) || 60));
    return NextResponse.json(getRush(count), { headers: { "Cache-Control": "no-store" } });
  }

  const theme = params.get("theme") ?? "";
  if (!isTheme(theme)) return NextResponse.json({ error: "invalid theme" }, { status: 400 });
  const rating = Number(params.get("rating")) || 1200;
  const exclude = new Set((params.get("exclude") ?? "").split(",").filter(Boolean));
  return NextResponse.json(getTraining(theme, rating, exclude, 12), { headers: { "Cache-Control": "no-store" } });
}
