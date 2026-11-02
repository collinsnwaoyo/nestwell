"use client";

import { DISABLED_NAV_ITEMS, LIVE_NAV_ITEMS } from "@/config/nav";
import { AboutDemoButton } from "./about-demo-button";
import { BrandMark } from "./brand-mark";
import { NavLink } from "./nav-link";

/**
 * 240px sidebar from 1024px; a 64px icon rail with tooltips from 768px;
 * hidden below that, where the bottom tab bar takes over.
 */
export function Sidebar({ ownerName }: { ownerName: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col self-start border-r border-border bg-background px-3 py-5 md:flex lg:w-60 lg:px-4">
      <div className="mb-8 flex items-center gap-2.5 px-1.5 max-lg:justify-center max-lg:px-0">
        <BrandMark />
        <span className="text-h3 font-semibold tracking-tight max-lg:sr-only">Nestwell</span>
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5">
        {LIVE_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <p className="mt-6 mb-1.5 px-2.5 text-meta-style max-lg:sr-only">In the full version</p>
        <div className="mt-6 mb-2 h-px bg-border lg:hidden" aria-hidden />
        {DISABLED_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="flex items-center gap-3 px-1.5 max-lg:justify-center max-lg:px-0">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-meta font-semibold"
        >
          {ownerName[0]}
        </span>
        <div className="min-w-0 flex-1 max-lg:sr-only">
          <p className="truncate text-h3 font-semibold">{ownerName}</p>
          <AboutDemoButton />
        </div>
      </div>
    </aside>
  );
}
