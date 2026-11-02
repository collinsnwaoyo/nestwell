"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Bottom sheet on mobile, centered panel on desktop. Shared shell for drawers and forms. */
export function Sheet({
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
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-xl border border-border bg-card p-6 sm:inset-x-auto sm:right-6 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-y-1/2 sm:rounded-xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">{title}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
