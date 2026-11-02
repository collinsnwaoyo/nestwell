"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsClient, useMediaQuery } from "@/lib/use-media-query";
import { Tooltip } from "./tooltip";

const EASE_OUT = [0.25, 1, 0.5, 1] as const;
const EASE_OUT_X = [0.16, 1, 0.3, 1] as const;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

// Safari doesn't focus buttons on click, so remember the last control pressed
// to hand focus back to it when the drawer closes.
let lastPressed: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener(
    "pointerdown",
    (event) => {
      lastPressed = (event.target as HTMLElement).closest<HTMLElement>("button, a, [tabindex]");
    },
    true,
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The one overlay panel. From 768px it slides in over the page from the
 * right (the page underneath never moves); below that it's a bottom sheet
 * that can be dragged down to dismiss. Traps focus, closes on Escape, and
 * hands focus back to whatever opened it.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  actions,
  tall = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Extra header buttons, shown before Close (e.g. Edit). */
  actions?: ReactNode;
  /** Bottom sheet fills 92% of the screen (tenant details) rather than fitting its content. */
  tall?: boolean;
  children: ReactNode;
}) {
  const isClient = useIsClient();
  const isSheet = !useMediaQuery("(min-width: 768px)");
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const dragControls = useDragControls();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement as HTMLElement | null;
    const opener = active && active !== document.body ? active : lastPressed;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    panelRef.current?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousOverflow;
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open]);

  if (!isClient) return null;

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  }

  const hidden = isSheet ? { y: "100%" } : { x: "100%" };
  const shown = isSheet ? { y: 0 } : { x: 0 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" key="drawer">
          <motion.div
            className="absolute inset-0 bg-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.22, ease: EASE_IN_OUT } }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : hidden}
            animate={
              reduceMotion
                ? { opacity: 1, transition: { duration: 0.1 } }
                : { ...shown, transition: { duration: 0.28, ease: EASE_OUT_X } }
            }
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.1 } }
                : { ...hidden, transition: { duration: 0.22, ease: EASE_IN_OUT } }
            }
            drag={isSheet && !reduceMotion ? "y" : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragSnapToOrigin
            dragTransition={{ bounceStiffness: 600, bounceDamping: 40 }}
            onDragEnd={onDragEnd}
            className={cn(
              "absolute flex flex-col bg-surface shadow-3 outline-none",
              isSheet
                ? cn("inset-x-0 bottom-0 max-h-[92dvh] rounded-t-lg", tall && "h-[92dvh]")
                : "inset-y-0 right-0 w-[440px] max-w-full",
            )}
          >
            {/* Dragging starts from the handle or header, never the scrolling body. */}
            {isSheet && (
              <div
                className="flex shrink-0 touch-none justify-center pt-2.5 pb-1"
                onPointerDown={(event) => dragControls.start(event)}
                aria-hidden
              >
                <span className="h-1 w-10 rounded-full bg-border-strong" />
              </div>
            )}
            <div
              onPointerDown={(event) => isSheet && dragControls.start(event)}
              className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 pt-3 pb-4 md:py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-[18px] leading-[26px] font-semibold">
                  {title}
                </h2>
                {description && <p className="truncate text-meta-style">{description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {actions}
                <Tooltip content="Close" side="bottom">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-(--dur-1) hover:bg-surface-sunk hover:text-foreground max-md:size-11"
                  >
                    <X className="size-5" />
                  </button>
                </Tooltip>
              </div>
            </div>
            <motion.div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: reduceMotion ? 0 : 0.06, duration: 0.2 } }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
