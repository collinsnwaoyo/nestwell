"use client";

import type { ReactNode } from "react";
import { cn } from "cn";
import { formatNaira } from "@/lib/domain";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { OccupancyBar } from "@/components/property-list";

/** Label, value and a sublabel. On phones it's one row: label and sublabel left, value right. */
function StatBlock({ label, value, children }: { label: string; value: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-x-4 px-5 py-4 sm:block">
      <p className="text-h3 font-semibold">{label}</p>
      <div className="row-span-2 text-stat-sm font-semibold sm:mt-1">{value}</div>
      <div className="sm:mt-0.5">{children}</div>
    </div>
  );
}

/** Three compact stats in one surface, divided by hairlines (stacked on phones). */
export function StatStrip({
  paymentsDue,
  overdue,
  bedsFilled,
  bedsTotal,
  rentRoll,
  properties,
}: {
  paymentsDue: number;
  overdue: number;
  bedsFilled: number;
  bedsTotal: number;
  rentRoll: number;
  properties: number;
}) {
  const count = (value: number) => String(value);
  return (
    <div className="grid divide-y divide-border rounded-lg border border-border bg-surface shadow-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <StatBlock
        label="Payments due"
        value={<AnimatedNumber value={paymentsDue} format={count} intro duration={0.6} className={cn(paymentsDue > 0 && "text-warning")} />}
      >
        <p className={cn("text-meta font-medium", overdue > 0 ? "text-danger" : "text-muted-foreground")}>
          {overdue > 0 ? `${overdue} overdue` : "None overdue"}
        </p>
      </StatBlock>
      <StatBlock
        label="Vacant beds"
        value={<AnimatedNumber value={bedsTotal - bedsFilled} format={count} intro duration={0.6} />}
      >
        <p className="text-meta-style tabular-nums">
          {bedsFilled} of {bedsTotal} filled
        </p>
        <OccupancyBar filled={bedsFilled} total={bedsTotal} className="mt-1.5 w-full max-w-24" />
      </StatBlock>
      <StatBlock label="Rent roll" value={<AnimatedNumber value={rentRoll} format={formatNaira} intro duration={0.6} />}>
        <p className="text-meta-style">
          {properties} propert{properties === 1 ? "y" : "ies"}
        </p>
      </StatBlock>
    </div>
  );
}
