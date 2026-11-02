"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import { formatNaira, toLagosDate } from "@/lib/domain";
import { shouldPlayIntro } from "@/lib/intro";

const HEIGHT = 120;
const PAD_Y = 8;

/**
 * Running total collected over the last 30 days as a soft area chart.
 * Hover (or arrow keys when focused) shows the day and the total with a
 * guide line. The line draws in on the first Home visit of the session.
 */
export function RevenueChart({ points }: { points: { date: string; total: number }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [playIntro, setPlayIntro] = useState(false);
  const reduceMotion = useReducedMotion();
  const gradientId = useId();

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    setWidth(node.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Decided after mount: the intro flag only exists in the browser.
    if (shouldPlayIntro() && !reduceMotion) setPlayIntro(true);
  }, [reduceMotion]);

  const max = Math.max(...points.map((p) => p.total), 1);
  const x = (i: number) => (points.length === 1 ? width : (i / (points.length - 1)) * width);
  const y = (total: number) => PAD_Y + (1 - total / max) * (HEIGHT - PAD_Y * 2);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(" ");
  const area = `${line} L${width},${HEIGHT} L0,${HEIGHT} Z`;

  const first = points[0];
  const last = points[points.length - 1];
  const summary = `Revenue ${last.total >= first.total ? "rose" : "fell"} from ${formatNaira(first.total)} to ${formatNaira(last.total)} over ${points.length} days`;

  function pick(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || width === 0) return;
    const ratio = Math.min(Math.max((clientX - rect.left) / width, 0), 1);
    setActive(Math.round(ratio * (points.length - 1)));
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setActive((current) => Math.min(Math.max((current ?? points.length - 1) + step, 0), points.length - 1));
  }

  const point = active !== null ? points[active] : null;
  const tooltipLeft = active !== null ? Math.min(Math.max(x(active), 60), width - 60) : 0;

  return (
    <div>
      <div
        ref={containerRef}
        role="img"
        aria-label={summary}
        tabIndex={0}
        onPointerMove={(event) => pick(event.clientX)}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
        className="relative h-[120px] touch-pan-y rounded-md"
      >
        {width > 0 && (
          <svg
            // Remount once the intro decision is made so the draw-in starts from nothing.
            key={String(playIntro)}
            width={width}
            height={HEIGHT}
            className="block overflow-visible text-positive"
            data-intro-hide=""
            aria-hidden
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.08} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <motion.path
              d={area}
              fill={`url(#${gradientId})`}
              initial={playIntro ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: playIntro ? 0.15 : 0, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
            />
            <motion.path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={playIntro ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            />
            {point && active !== null && (
              <>
                <line x1={x(active)} x2={x(active)} y1={0} y2={HEIGHT} className="stroke-border-strong" strokeWidth={1} />
                <circle cx={x(active)} cy={y(point.total)} r={3.5} className="fill-surface" stroke="currentColor" strokeWidth={1.5} />
              </>
            )}
          </svg>
        )}
        {point && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md bg-primary px-2.5 py-1.5 text-meta whitespace-nowrap text-primary-foreground shadow-2"
            style={{ left: tooltipLeft }}
          >
            <span className="opacity-75">{format(toLagosDate(point.date), "d MMM")}</span>{" "}
            <span className="font-semibold tabular-nums">{formatNaira(point.total)}</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between text-meta-style">
        <span>{format(toLagosDate(first.date), "d MMM")}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
