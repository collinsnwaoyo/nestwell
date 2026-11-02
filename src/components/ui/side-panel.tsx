"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/lib/use-media-query";
import { Sheet } from "./sheet";
import { SIDE_PANEL_SLOT_ID } from "./side-panel-slot";

/**
 * Desktop: a panel that sits beside the page and pushes the content aside
 * (rendered into the app shell's slot). Below lg there's no room to push,
 * so it falls back to the bottom sheet.
 */
export function SidePanel({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (!open || !isDesktop) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isDesktop, onClose]);

  const slot = isDesktop ? document.getElementById(SIDE_PANEL_SLOT_ID) : null;

  if (!slot) {
    return (
      <Sheet open={open} onClose={onClose} title={title} description={description}>
        {children}
      </Sheet>
    );
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.aside
          key="side-panel"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          className="sticky top-0 h-dvh w-[380px] shrink-0 self-start overflow-y-auto border-l border-border bg-card xl:w-[420px]"
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card px-6 py-5">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{title}</h2>
              {description && <p className="truncate text-sm text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close panel"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>,
    slot,
  );
}
