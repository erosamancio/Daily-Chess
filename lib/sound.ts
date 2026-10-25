"use client";

type SoundName = "move" | "capture" | "good" | "bad" | "solved";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function knock(c: AudioContext, start: number, freq: number, gain: number) {
  const len = Math.floor(c.sampleRate * 0.06);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 3;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(c.destination);
  src.start(start);
}

if (typeof window !== "undefined") {
  const unlock = () => {
    const c = audio();
    if (c && c.state !== "suspended") window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
}

export function playSound(name: SoundName) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  switch (name) {
    case "move":
      knock(c, t, 1400, 1.4);
      break;
    case "capture":
      knock(c, t, 900, 1.8);
      knock(c, t + 0.045, 1600, 0.9);
      break;
    case "good":
      tone(c, 880, t, 0.18, "sine", 0.12);
      break;
    case "bad":
      tone(c, 196, t, 0.22, "triangle", 0.16);
      tone(c, 185, t + 0.09, 0.22, "triangle", 0.12);
      break;
    case "solved":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.085, 0.42, "sine", 0.1));
      break;
  }
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}
