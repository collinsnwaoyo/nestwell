"use client";

import Link from "next/link";
import { BedDouble, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RentStatusPill } from "@/components/ui/status-pill";
import { PushReminderButton } from "@/components/property/push-reminder-button";
import type { RentStatus } from "@/lib/domain";

export interface AttentionItem {
  key: string;
  name: string;
  detail: string;
  status: RentStatus;
  href: string;
  /** Present for tenants who can be sent a reminder. */
  tenancyId?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

/** Up to five things to act on today: who's late, who's due, which beds are empty. */
export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-5 text-muted-foreground shadow-1">
        Nothing needs attention. Everyone is paid up and every bed is filled.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface shadow-1">
      {items.map((item) => (
        <li key={item.key} className="flex gap-3 px-4 py-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-meta font-semibold text-muted-foreground"
          >
            {item.status === "vacant" ? <BedDouble className="size-4" strokeWidth={1.75} /> : initials(item.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <Link href={item.href} className="min-w-0 truncate rounded-sm font-medium hover:underline">
                {item.name}
              </Link>
              <RentStatusPill status={item.status} />
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate text-meta-style" title={item.detail}>{item.detail}</span>
              {item.tenancyId && item.status !== "notice" ? (
                <PushReminderButton tenancyId={item.tenancyId} label="Remind" variant="ghost" size="compact" />
              ) : item.status === "vacant" ? (
                <Link href={item.href} className={buttonVariants({ variant: "ghost", size: "compact" })}>
                  <Plus aria-hidden /> Add tenant
                </Link>
              ) : (
                <Link href={item.href} className={buttonVariants({ variant: "ghost", size: "compact" })}>
                  View
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
