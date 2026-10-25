"use client";

import { useEffect, useState } from "react";
import { DAILY_TIMEZONE } from "./daily";

function secondsToMidnight(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DAILY_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return 86_400 - (get("hour") * 3600 + get("minute") * 60 + get("second"));
}

export function useCountdown() {
  const [secs, setSecs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setSecs(secondsToMidnight());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (secs === null) return "--:--:--";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}
