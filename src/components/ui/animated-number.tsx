"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

/**
 * A number that tweens to its new value whenever it changes (e.g. a balance
 * counting down after a payment). With `countUp`, it also counts up from
 * zero on mount. Tabular figures keep the width steady while it moves.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 0.4,
  countUp = false,
  className,
}: {
  value: number;
  format: (value: number) => string;
  duration?: number;
  countUp?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(countUp ? 0 : value);
  const reduceMotion = useReducedMotion();
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
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
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {format(value)}
    </span>
  );
}
