"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/use-media-query";

const HOVER_DELAY_MS = 300;
const GAP = 8;
const EDGE = 8;

type Side = "right" | "top" | "bottom";

const SIDE_OFFSET = { right: { x: -4, y: 0 }, top: { x: 0, y: 4 }, bottom: { x: 0, y: -4 } } as const;

/**
 * Small text tooltip. Appears after 300ms on hover and at once on keyboard
 * focus. Rendered at the end of <body> with fixed positioning so a card or
 * panel with overflow hidden can't clip it; flips below the trigger when
 * there's no room above, and stays inside the viewport.
 */
export function Tooltip({
  content,
  side = "top",
  className,
  contentClassName,
  children,
}: {
  content: ReactNode;
  side?: Side;
  className?: string;
  /** E.g. "lg:hidden" when the label is already visible at that width. */
  contentClassName?: string;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; side: Side } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const isClient = useIsClient();

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Any scroll moves the trigger out from under a fixed tooltip, so close it.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  // Place the tooltip once it's rendered and its size is known.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tipRef.current) return;
    const anchor = triggerRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    let placed: Side = side;
    if (side === "top" && anchor.top - tip.height - GAP < EDGE) placed = "bottom";
    if (side === "bottom" && anchor.bottom + tip.height + GAP > window.innerHeight - EDGE) placed = "top";
    if (side === "right" && anchor.right + tip.width + GAP > window.innerWidth - EDGE) placed = "top";

    let left: number;
    let top: number;
    if (placed === "right") {
      left = anchor.right + GAP;
      top = anchor.top + anchor.height / 2 - tip.height / 2;
    } else {
      left = anchor.left + anchor.width / 2 - tip.width / 2;
      top = placed === "top" ? anchor.top - tip.height - GAP : anchor.bottom + GAP;
    }
    left = Math.min(Math.max(left, EDGE), window.innerWidth - tip.width - EDGE);
    setPosition({ left, top, side: placed });
  }, [open, side]);

  function show(delay: number) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
    setPosition(null);
  }

  // The entry slide comes from the requested side; the measured side only exists after mount.
  const offset = reduceMotion ? { x: 0, y: 0 } : SIDE_OFFSET[side];

  return (
    <span
      ref={triggerRef}
      className={cn("relative inline-flex", className)}
      aria-describedby={open ? id : undefined}
      onPointerEnter={(event) => event.pointerType === "mouse" && show(HOVER_DELAY_MS)}
      onPointerLeave={hide}
      onFocus={(event) => (event.target as HTMLElement).matches(":focus-visible") && show(0)}
      onBlur={hide}
      onKeyDown={(event) => event.key === "Escape" && hide()}
    >
      {children}
      {isClient &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.span
                ref={tipRef}
                id={id}
                role="tooltip"
                // Hidden for the one frame before it's measured and placed.
                style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? "visible" : "hidden" }}
                initial={{ opacity: 0, ...offset }}
                animate={position ? { opacity: 1, x: 0, y: 0 } : { opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className={cn(
                  "pointer-events-none fixed z-[60] w-max max-w-64 rounded-md bg-primary px-2.5 py-1.5 text-meta font-medium text-primary-foreground shadow-2",
                  contentClassName,
                )}
              >
                {content}
              </motion.span>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </span>
  );
}
