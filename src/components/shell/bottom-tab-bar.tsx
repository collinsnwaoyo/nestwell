"use client";

import { LIVE_NAV_ITEMS } from "@/config/nav";
import { NavLink } from "./nav-link";

export function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border/60 bg-background/95 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)] backdrop-blur md:hidden">
      {LIVE_NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} tooltipSide="top" variant="bottom-bar" />
      ))}
    </nav>
  );
}
