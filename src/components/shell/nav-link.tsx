"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import type { NavItem } from "@/config/nav";
import { Tooltip } from "@/components/ui/tooltip";

const LOCKED_TOOLTIP = "Available in the full version";

const ITEM_BASE =
  "flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-body font-medium transition-[background-color,color] duration-(--dur-1) ease-out max-lg:justify-center max-lg:px-0";

/**
 * A sidebar item. From 1024px it shows icon and label; between 768 and
 * 1023px the sidebar is an icon rail, so the label moves into a tooltip.
 */
export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const active = !item.disabled && pathname.startsWith(item.href);

  if (item.disabled) {
    return (
      <Tooltip
        content={
          <>
            <span className="lg:hidden">{item.label}: </span>
            {LOCKED_TOOLTIP}
          </>
        }
        side="right"
        className="w-full"
      >
        <button
          type="button"
          aria-disabled="true"
          aria-label={`${item.label}, available in the full version`}
          onClick={(event) => event.preventDefault()}
          className={cn(ITEM_BASE, "cursor-not-allowed text-faint")}
        >
          <Icon
            aria-hidden
            className="size-[18px] shrink-0"
            strokeWidth={1.75}
          />
          <span className="truncate max-lg:sr-only">{item.label}</span>
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={item.label}
      side="right"
      className="w-full"
      contentClassName="lg:hidden"
    >
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        className={cn(
          ITEM_BASE,
          active
            ? "bg-surface text-foreground shadow-1"
            : "text-muted-foreground hover:bg-surface-sunk hover:text-foreground",
        )}
      >
        <Icon
          aria-hidden
          className={cn("size-[18px] shrink-0", active && "text-positive")}
          strokeWidth={1.75}
        />
        <span className="truncate max-lg:sr-only">{item.label}</span>
      </Link>
    </Tooltip>
  );
}
