"use client";

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { BOARD_THEMES } from "./boardThemes";

/**
 * Tabuleiro próprio e leve: 64 casas, peças em CSS (data URI) e animação só com `transform`.
 * Substitui o react-chessboard, que carregava dnd-kit e re-renderizava o tabuleiro inteiro a cada arraste.
 */

const FILES = "abcdefgh";
const DRAG_THRESHOLD = 5;

type Orientation = "white" | "black";
type Placed = { id: number; code: string; sq: string };
export type Arrow = { from: string; to: string; color?: string };

type Props = {
  fen: string;
  orientation: Orientation;
  theme: keyof typeof BOARD_THEMES;
  /** Estilos extras por casa (último lance, seleção, dica, xeque...), aplicados numa camada por cima da cor da casa. */
  squareStyles?: Record<string, CSSProperties>;
  arrows?: Arrow[];
  /** Onda de vitória a partir desta casa; `id` reinicia a animação. */
  ripple?: { from: string; id: number } | null;
  interactive?: boolean;
  selected?: string | null;
  canPick?: (square: string) => boolean;
  isTarget?: (square: string) => boolean;
  onSelect?: (square: string | null) => void;
  /** Retorna true se a peça deve ficar na casa de destino. */
  onMove?: (from: string, to: string) => boolean;
};

function parsePlacement(fen: string): Map<string, string> {
  const map = new Map<string, string>();
  fen
    .split(" ")[0]
    .split("/")
    .forEach((row, r) => {
      let f = 0;
      for (const ch of row) {
        if (/\d/.test(ch)) f += Number(ch);
        else {
          map.set(`${FILES[f]}${8 - r}`, (ch === ch.toUpperCase() ? "w" : "b") + ch.toUpperCase());
          f++;
        }
      }
    });
  return map;
}

function distance(a: string, b: string) {
  return Math.abs(FILES.indexOf(a[0]) - FILES.indexOf(b[0])) + Math.abs(Number(a[1]) - Number(b[1]));
}

let nextId = 1;
/** Mantém a identidade das peças entre posições, para que um lance anime a peça certa. */
function reconcile(prev: Placed[], fen: string): Placed[] {
  const next = parsePlacement(fen);
  const out: Placed[] = [];
  const free = [...prev];
  const pending: [string, string][] = [];
  for (const [sq, code] of next) {
    const i = free.findIndex((p) => p.sq === sq && p.code === code);
    if (i >= 0) out.push(free.splice(i, 1)[0]);
    else pending.push([sq, code]);
  }
  for (const [sq, code] of pending) {
    let best = -1;
    for (let i = 0; i < free.length; i++)
      if (free[i].code === code && (best < 0 || distance(free[i].sq, sq) < distance(free[best].sq, sq))) best = i;
    const id = best >= 0 ? free.splice(best, 1)[0].id : nextId++;
    out.push({ id, code, sq });
  }
  return out;
}

function coords(sq: string, orientation: Orientation) {
  const f = FILES.indexOf(sq[0]);
  const r = Number(sq[1]) - 1;
  return orientation === "white" ? { x: f, y: 7 - r } : { x: 7 - f, y: r };
}

function usePieces(fen: string) {
  const ref = useRef<{ fen: string; pieces: Placed[] } | null>(null);
  if (!ref.current || ref.current.fen !== fen) ref.current = { fen, pieces: reconcile(ref.current?.pieces ?? [], fen) };
  return ref.current.pieces;
}

export const Board = memo(function Board({
  fen,
  orientation,
  theme,
  squareStyles,
  arrows = [],
  ripple,
  interactive = false,
  selected = null,
  canPick,
  isTarget,
  onSelect,
  onMove,
}: Props) {
  const colors = BOARD_THEMES[theme];
  const pieces = usePieces(fen);
  const boardRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ sq: string; code: string; x: number; y: number; wasSelected: boolean; dragging: boolean } | null>(null);
  const rightFrom = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [instant, setInstant] = useState<number | null>(null);
  const [drawn, setDrawn] = useState<{ arrows: Arrow[]; circles: string[] }>({ arrows: [], circles: [] });

  // Desenhos do usuário somem quando a posição muda.
  useEffect(() => setDrawn({ arrows: [], circles: [] }), [fen]);
  // A peça solta no lugar não deve "voar" de novo da origem.
  useLayoutEffect(() => {
    if (instant === null) return;
    const id = requestAnimationFrame(() => setInstant(null));
    return () => cancelAnimationFrame(id);
  }, [instant]);

  const squareAt = (clientX: number, clientY: number): string | null => {
    const rect = boardRef.current!.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const y = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;
    return orientation === "white" ? `${FILES[x]}${8 - y}` : `${FILES[7 - x]}${y + 1}`;
  };

  const moveGhost = (clientX: number, clientY: number) => {
    const ghost = ghostRef.current;
    const board = boardRef.current;
    if (!ghost || !board) return;
    const rect = board.getBoundingClientRect();
    const size = rect.width / 8;
    ghost.style.transform = `translate(${clientX - rect.left - size / 2}px, ${clientY - rect.top - size / 2}px) scale(1.12)`;
  };

  const pieceAt = (sq: string) => pieces.find((p) => p.sq === sq);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const sq = squareAt(e.clientX, e.clientY);
    if (!sq) return;
    if (e.button === 2) {
      rightFrom.current = sq;
      return;
    }
    if (e.button !== 0) return;
    if (drawn.arrows.length || drawn.circles.length) setDrawn({ arrows: [], circles: [] });
    if (!interactive) return;
    if (selected && sq !== selected && isTarget?.(sq)) {
      onMove?.(selected, sq);
      return;
    }
    const piece = pieceAt(sq);
    if (piece && canPick?.(sq)) {
      e.currentTarget.setPointerCapture(e.pointerId);
      press.current = { sq, code: piece.code, x: e.clientX, y: e.clientY, wasSelected: selected === sq, dragging: false };
      if (selected !== sq) onSelect?.(sq);
      return;
    }
    onSelect?.(null);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p) return;
    if (!p.dragging) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
      p.dragging = true;
      const ghost = ghostRef.current;
      if (ghost) ghost.className = `dc-ghost pc-${p.code}`;
      setDragging(p.sq);
    }
    moveGhost(e.clientX, e.clientY);
  };

  const endDrag = () => {
    press.current = null;
    if (ghostRef.current) ghostRef.current.className = "dc-ghost hidden";
    setDragging(null);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button === 2) {
      const from = rightFrom.current;
      const to = squareAt(e.clientX, e.clientY);
      rightFrom.current = null;
      if (!from || !to) return;
      setDrawn((d) =>
        from === to
          ? { ...d, circles: d.circles.includes(to) ? d.circles.filter((c) => c !== to) : [...d.circles, to] }
          : {
              ...d,
              arrows: d.arrows.some((a) => a.from === from && a.to === to)
                ? d.arrows.filter((a) => !(a.from === from && a.to === to))
                : [...d.arrows, { from, to }],
            },
      );
      return;
    }
    const p = press.current;
    if (!p) return;
    if (p.dragging) {
      const to = squareAt(e.clientX, e.clientY);
      const kept = to && to !== p.sq ? onMove?.(p.sq, to) : false;
      if (kept) {
        const moved = pieces.find((x) => x.sq === p.sq);
        if (moved) setInstant(moved.id);
      }
    } else if (p.wasSelected) {
      onSelect?.(null);
    }
    endDrag();
  };

  const squares = useMemo(() => {
    const out: { sq: string; x: number; y: number; light: boolean }[] = [];
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const sq = orientation === "white" ? `${FILES[x]}${8 - y}` : `${FILES[7 - x]}${y + 1}`;
        out.push({ sq, x, y, light: (x + y) % 2 === 0 });
      }
    return out;
  }, [orientation]);

  const allArrows = [...arrows, ...drawn.arrows.map((a) => ({ ...a, color: "rgba(30, 110, 80, 0.8)" }))];

  return (
    <div
      ref={boardRef}
      className={`dc-board relative aspect-square w-full select-none ${interactive ? "touch-none" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={endDrag}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
        {squares.map(({ sq, x, y, light }) => {
          const ink = light ? colors.lightInk : colors.darkInk;
          const extra = squareStyles?.[sq];
          const delay = ripple ? Math.max(Math.abs(x - coords(ripple.from, orientation).x), Math.abs(y - coords(ripple.from, orientation).y)) * 55 : 0;
          return (
            <div key={sq} data-square={sq} className="relative" style={{ background: light ? colors.light : colors.dark, cursor: extra?.cursor }}>
              {extra && <div className="absolute inset-0" style={extra} />}
              {ripple && <div key={ripple.id} className="dc-ripple absolute inset-0" style={{ animationDelay: `${delay}ms` }} />}
              {drawn.circles.includes(sq) && <div className="absolute inset-[6%] rounded-full border-[3px] border-brand/80" />}
              {x === 0 && (
                <span className="pointer-events-none absolute top-[3%] left-[4%] text-[10px] leading-none font-semibold sm:text-[11px]" style={{ color: ink }}>
                  {sq[1]}
                </span>
              )}
              {y === 7 && (
                <span className="pointer-events-none absolute right-[4%] bottom-[3%] text-[10px] leading-none font-semibold sm:text-[11px]" style={{ color: ink }}>
                  {sq[0]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {pieces.map((p) => {
          const { x, y } = coords(p.sq, orientation);
          return (
            <div
              key={p.id}
              className={`dc-piece pc-${p.code}`}
              style={{
                transform: `translate(${x * 100}%, ${y * 100}%)`,
                opacity: dragging === p.sq ? 0.25 : 1,
                transition: instant === p.id ? "none" : undefined,
              }}
            />
          );
        })}
      </div>

      {allArrows.length > 0 && <Arrows arrows={allArrows} orientation={orientation} />}
      <div ref={ghostRef} className="dc-ghost hidden" aria-hidden />
    </div>
  );
});

function Arrows({ arrows, orientation }: { arrows: Arrow[]; orientation: Orientation }) {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 8 8" aria-hidden>
      {arrows.map(({ from, to, color = "rgba(217, 142, 42, 0.85)" }) => {
        const a = coords(from, orientation);
        const b = coords(to, orientation);
        const [x1, y1, x2, y2] = [a.x + 0.5, a.y + 0.5, b.x + 0.5, b.y + 0.5];
        const len = Math.hypot(x2 - x1, y2 - y1);
        const ux = (x2 - x1) / len;
        const uy = (y2 - y1) / len;
        const head = 0.42;
        const ex = x2 - ux * head;
        const ey = y2 - uy * head;
        const px = -uy * 0.24;
        const py = ux * 0.24;
        return (
          <g key={`${from}${to}`} fill={color} stroke={color}>
            <line x1={x1 + ux * 0.2} y1={y1 + uy * 0.2} x2={ex} y2={ey} strokeWidth={0.16} strokeLinecap="round" />
            <polygon points={`${x2 - ux * 0.08},${y2 - uy * 0.08} ${ex + px},${ey + py} ${ex - px},${ey - py}`} stroke="none" />
          </g>
        );
      })}
    </svg>
  );
}
