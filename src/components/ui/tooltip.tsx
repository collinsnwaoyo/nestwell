"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const HOVER_DELAY_MS = 300;

const SIDE_CLASSES = {
  right: "top-1/2 left-[calc(100%+8px)] -translate-y-1/2",
  top: "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
  bottom: "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",
} as const;

const SIDE_OFFSET = { right: { x: -4, y: 0 }, top: { x: 0, y: 4 }, bottom: { x: 0, y: -4 } } as const;

/**
 * Small text tooltip. Appears after 300ms on hover and at once on keyboard
 * focus. The trigger is described by the tooltip for screen readers.
 */
export function Tooltip({
  content,
  side = "top",
  className,
  contentClassName,
  children,
}: {
  content: ReactNode;
  side?: keyof typeof SIDE_CLASSES;
  className?: string;
  /** E.g. "lg:hidden" when the label is already visible at that width. */
  contentClassName?: string;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function show(delay: number) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  }

  const offset = reduceMotion ? { x: 0, y: 0 } : SIDE_OFFSET[side];

  return (
    <span
      className={cn("relative inline-flex", className)}
      aria-describedby={open ? id : undefined}
      onPointerEnter={(event) => event.pointerType === "mouse" && show(HOVER_DELAY_MS)}
      onPointerLeave={hide}
      onFocus={(event) => (event.target as HTMLElement).matches(":focus-visible") && show(0)}
      onBlur={hide}
      onKeyDown={(event) => event.key === "Escape" && hide()}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, ...offset }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              "pointer-events-none absolute z-50 w-max max-w-64 rounded-md bg-primary px-2.5 py-1.5 text-meta font-medium text-primary-foreground shadow-2",
              SIDE_CLASSES[side],
              contentClassName,
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
