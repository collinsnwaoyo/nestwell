"use client";

import { useRouter } from "next/navigation";
import { Building2, Info } from "lucide-react";
import { DISABLED_NAV_ITEMS, LIVE_NAV_ITEMS } from "@/config/nav";
import { clearWelcomeSeen } from "@/lib/welcome";
import { NavLink } from "./nav-link";

export function Sidebar() {
  const router = useRouter();

  return (
    <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r border-border/60 px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Building2 className="size-4.5" />
        </div>
        <span className="text-base font-semibold tracking-tight">Nestwell</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {LIVE_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} tooltipSide="right" />
        ))}

        <div className="my-3 h-px bg-border/60" />

        {DISABLED_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} tooltipSide="right" />
        ))}
      </nav>

      <button
        type="button"
        onClick={() => {
          clearWelcomeSeen();
          router.push("/");
        }}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Info className="size-3.5" />
        About this demo
      </button>
    </aside>
  );
}
