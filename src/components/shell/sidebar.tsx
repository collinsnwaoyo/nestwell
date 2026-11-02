"use client";

import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { DISABLED_NAV_ITEMS, LIVE_NAV_ITEMS } from "@/config/nav";
import { clearWelcomeSeen } from "@/lib/welcome";
import { NavLink } from "./nav-link";

export function Sidebar({ ownerName }: { ownerName: string }) {
  const router = useRouter();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col self-start bg-background px-5 py-7 md:flex">
      <div className="mb-10 flex items-center gap-2.5 px-3">
        <span className="size-2.5 rounded-sm bg-primary" aria-hidden />
        <span className="text-[17px] font-semibold tracking-tight">Nestwell</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {LIVE_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} tooltipSide="right" />
        ))}

        <div className="my-4 h-px bg-border" />

        {DISABLED_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} tooltipSide="right" />
        ))}
      </nav>

      <div className="flex items-center gap-3 px-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
          {ownerName[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{ownerName}</p>
          <button
            type="button"
            onClick={() => {
              clearWelcomeSeen();
              router.push("/");
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Info className="size-3" /> About this demo
          </button>
        </div>
      </div>
    </aside>
  );
}
