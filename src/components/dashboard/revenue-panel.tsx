"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { StatusPill } from "@/components/ui/status-pill";
import { RevenueChart } from "./revenue-chart";

/** Rent collected in the last 30 days, its change against the 30 before, and the running total. */
export function RevenuePanel({
  collected,
  previous,
  daily,
}: {
  collected: number;
  previous: number;
  daily: { date: string; total: number }[];
}) {
  const change = previous === 0 ? null : Math.round(((collected - previous) / previous) * 100);

  return (
    <section aria-labelledby="revenue-title" className="rounded-lg border border-border bg-surface p-5 shadow-1">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 id="revenue-title" className="text-h3 font-semibold">
            Revenue, last 30 days
          </h2>
          <AnimatedNumber
            value={collected}
            format={formatNaira}
            intro
            duration={0.6}
            className="mt-1 block text-stat font-semibold text-positive"
          />
        </div>
        {change !== null && (
          <div className="flex items-center gap-2">
            <StatusPill
              tone={change >= 0 ? "positive" : "danger"}
              icon={
                change >= 0 ? (
                  <ArrowUpRight aria-hidden className="size-3.5" />
                ) : (
                  <ArrowDownRight aria-hidden className="size-3.5" />
                )
              }
            >
              {`${change >= 0 ? "+" : ""}${change}%`}
            </StatusPill>
            <span className="text-meta-style">vs previous 30 days</span>
          </div>
        )}
      </div>
      <div className="mt-5">
        <RevenueChart points={daily} />
      </div>
    </section>
  );
}
