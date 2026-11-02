"use client";

import { motion } from "framer-motion";

/** Page content fades and rises 6px on each route change; the sidebar, outside this template, stays still. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
