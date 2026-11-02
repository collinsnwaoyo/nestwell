"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { shouldPlayIntro } from "@/lib/intro";

/**
 * A number that tweens to its new value whenever it changes (e.g. a balance
 * counting down after a payment). With `intro`, it also counts up from zero
 * on the first Home visit of the session. Tabular figures keep the width
 * steady while it moves.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 0.4,
  intro = false,
  className,
}: {
  value: number;
  format: (value: number) => string;
  duration?: number;
  intro?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const introDuration = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const formatRef = useRef(format);
  formatRef.current = format;

  // On the first Home visit, restart from zero (the value is hidden by CSS until now).
  useEffect(() => {
    const node = ref.current;
    if (!intro || !node || !shouldPlayIntro()) return;
    node.style.opacity = "1";
    if (reduceMotion) return;
    shown.current = 0;
    introDuration.current = 0.6;
    node.textContent = formatRef.current(0);
    const controls = animate(0, value, {
      duration: 0.6,
      ease: [0.25, 1, 0.5, 1],
      onUpdate: (latest) => {
        shown.current = latest;
        node.textContent = formatRef.current(Math.round(latest));
      },
    });
    return () => {
      controls.stop();
      shown.current = value;
      node.textContent = formatRef.current(value);
    };
    // Mount only: later changes go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (introDuration.current !== null) {
      // The intro animation above is already heading to this value.
      introDuration.current = null;
      return;
    }
    if (reduceMotion || shown.current === value) {
      shown.current = value;
      node.textContent = formatRef.current(value);
      return;
    }
    const controls = animate(shown.current, value, {
      duration,
      ease: [0.25, 1, 0.5, 1],
      onUpdate: (latest) => {
        shown.current = latest;
        node.textContent = formatRef.current(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
      data-intro-hide={intro ? "" : undefined}
    >
      {format(value)}
    </span>
  );
}
