"use client";

import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

/** Takes the visitor back to the welcome note. */
export function AboutDemoButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="flex items-center gap-1 text-meta-style transition-colors duration-(--dur-1) hover:text-foreground"
    >
      <Info aria-hidden className="size-3.5" /> About this demo
    </button>
  );
}
