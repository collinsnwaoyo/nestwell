"use client";

import { useEffect } from "react";
import { markIntroPlayed } from "@/lib/intro";

/**
 * Rendered last on Home: once every number and chart above has started its
 * first-visit animation, record that the intro has played this session.
 * Deferred a tick so React's development double-run still sees the flag.
 */
export function IntroDone() {
  useEffect(() => {
    const timer = setTimeout(markIntroPlayed, 0);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
