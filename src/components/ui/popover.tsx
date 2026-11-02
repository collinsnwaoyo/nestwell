"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A small floating panel anchored under its trigger. Closes on outside
 * click and Escape (returning focus to the trigger). Enters with a short
 * fade and 4px rise from the trigger's edge.
 */
export function Popover({
  trigger,
  children,
  align = "start",
  role = "dialog",
  label,
  className,
}: {
  /** Render prop for the trigger; spread the props onto a button. */
  trigger: (props: {
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "dialog" | "menu";
    "aria-controls": string;
    ref: React.RefObject<HTMLButtonElement | null>;
  }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  role?: "dialog" | "menu";
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    // Move focus into the panel so keyboard users land on its first control.
    const first = panelRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"], [aria-selected="true"], button, [tabindex="0"]',
    );
    first?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        onClick: () => setOpen((value) => !value),
        "aria-expanded": open,
        "aria-haspopup": role,
        "aria-controls": id,
        ref: triggerRef,
      })}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={id}
            role={role}
            aria-label={label}
            initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              "absolute top-[calc(100%+6px)] z-40 min-w-56 rounded-lg border border-border bg-surface p-1.5 shadow-2",
              align === "start" ? "left-0 origin-top-left" : "right-0 origin-top-right",
              className,
            )}
          >
            {typeof children === "function" ? children(() => close()) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Arrow keys move between siblings matching `selector` inside the current target. */
export function moveFocus(event: React.KeyboardEvent<HTMLElement>, selector: string) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(selector)];
  if (items.length === 0) return;
  event.preventDefault();
  const index = items.indexOf(document.activeElement as HTMLElement);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
  items[next].focus();
}

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: "default" | "danger";
}

/** A dropdown menu of actions. */
export function Menu({
  trigger,
  items,
  label,
  align = "end",
}: {
  trigger: Parameters<typeof Popover>[0]["trigger"];
  items: MenuItem[];
  label: string;
  align?: "start" | "end";
}) {
  return (
    <Popover trigger={trigger} role="menu" label={label} align={align}>
      {(close) => (
        <div className="flex flex-col" onKeyDown={(event) => moveFocus(event, '[role="menuitem"]')}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={cn(
                "flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-left text-body transition-colors duration-(--dur-1) hover:bg-surface-sunk focus-visible:bg-surface-sunk max-md:min-h-11",
                item.tone === "danger" ? "text-danger" : "text-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
