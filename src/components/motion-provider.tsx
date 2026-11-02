"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Every Framer animation follows the visitor's reduced-motion setting: no movement, fades only. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
