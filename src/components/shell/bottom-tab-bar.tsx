"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { DISABLED_NAV_ITEMS, LIVE_NAV_ITEMS, type NavItem } from "@/config/nav";
import { Drawer } from "@/components/ui/drawer";
import { AboutDemoButton } from "./about-demo-button";

const TAB_CLASS =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium transition-colors duration-(--dur-1)";

function Tab({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const active = pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(TAB_CLASS, active ? "text-foreground" : "text-muted-foreground")}
    >
      <Icon aria-hidden className={cn("size-5", active && "text-positive")} strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

/** Below 768px: Home, Properties, Messages, and More for the rest. */
export function BottomTabBar() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-1 border-t border-border bg-surface px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+4px)] md:hidden"
      >
        {LIVE_NAV_ITEMS.map((item) => (
          <Tab key={item.href} item={item} />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          className={cn(TAB_CLASS, "text-muted-foreground")}
        >
          <MoreHorizontal aria-hidden className="size-5" strokeWidth={1.75} />
          More
        </button>
      </nav>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <p className="mb-2 text-meta-style">In the full version</p>
        <ul className="flex flex-col">
          {DISABLED_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex min-h-11 items-center gap-3 text-muted-foreground">
                <Icon aria-hidden className="size-5 text-faint" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 border-t border-border pt-4">
          <AboutDemoButton />
        </div>
      </Drawer>
    </>
  );
}
