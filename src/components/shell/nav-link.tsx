"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "cn";
import type { NavItem } from "@/config/nav";

interface NavLinkProps {
  item: NavItem;
  /** Sidebar shows the tooltip to the side; the bottom bar shows it above. */
  tooltipSide?: "right" | "top";
  variant?: "sidebar" | "bottom-bar";
}

export function NavLink({ item, tooltipSide = "right", variant = "sidebar" }: NavLinkProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const active = !item.disabled && pathname.startsWith(item.href);

  if (item.disabled) {
    return (
      <div className="group/nav relative">
        <button
          type="button"
          disabled
          aria-disabled
          className={cn(
            "flex cursor-not-allowed items-center gap-3 rounded-md text-muted-foreground/60 outline-none",
            variant === "sidebar" && "w-full px-3 py-2 text-sm font-medium",
            variant === "bottom-bar" && "flex-col gap-1 px-2 py-1 text-[11px] font-medium",
          )}
        >
          <span className="relative">
            <Icon className={variant === "sidebar" ? "size-4.5" : "size-5"} />
            <Lock className="absolute -right-1.5 -bottom-1 size-2.5 rounded-full bg-background text-muted-foreground/80" />
          </span>
          <span>{item.label}</span>
        </button>

        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-150 group-hover/nav:opacity-100",
            tooltipSide === "right" && "top-1/2 left-[calc(100%+8px)] -translate-y-1/2",
            tooltipSide === "top" && "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
          )}
        >
          Not in this demo
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        variant === "sidebar" &&
          cn(
            "w-full px-3 py-2 text-sm",
            active ? "text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground",
          ),
        variant === "bottom-bar" &&
          cn(
            "flex-col gap-1 px-2 py-1 text-[11px]",
            active ? "text-primary" : "text-muted-foreground",
          ),
      )}
    >
      <Icon className={variant === "sidebar" ? "size-4.5" : "size-5"} />
      <span>{item.label}</span>
    </Link>
  );
}
