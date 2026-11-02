"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { BrandMark } from "@/components/shell/brand-mark";
import { Button } from "@/components/ui/button";
import { RentStatusPill } from "@/components/ui/status-pill";
import type { RentStatus } from "@/lib/domain";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome";

// A glimpse of the demo's own story: the same tenants and amounts you'll find inside.
const PREVIEW: { initials: string; name: string; place: string; amount: string; status: RentStatus }[] = [
  { initials: "TA", name: "Tolulope Adebayo", place: "Lekki studio", amount: "₦500,000", status: "paid" },
  { initials: "BL", name: "Babatunde Lawal", place: "Yaba studio (Akoka side)", amount: "₦150,000", status: "due_today" },
  { initials: "HB", name: "Halima Bello", place: "Surulere 3-bedroom", amount: "₦75,000", status: "overdue" },
];

function rise(index: number) {
  return { "--row": index } as React.CSSProperties;
}

export default function WelcomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (hasSeenWelcome()) {
      router.replace("/home");
      return;
    }
    setChecked(true);
  }, [router]);

  function handleContinue() {
    markWelcomeSeen();
    router.push("/home");
  }

  if (!checked) return null;

  return (
    <main className="flex min-h-dvh items-center bg-background px-5 py-12 md:px-10">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:gap-16">
        <div className="flex flex-col items-start">
          <div className="flex animate-rise-in items-center gap-2.5" style={rise(0)}>
            <BrandMark />
            <span className="text-h3 font-semibold">Nestwell</span>
          </div>

          <h1 className="mt-10 animate-rise-in text-[34px] leading-[40px] font-semibold tracking-[-0.03em] md:text-hero" style={rise(1)}>
            Hi there.
          </h1>
          <p className="mt-4 max-w-md animate-rise-in text-[16px] leading-[26px] text-muted-foreground" style={rise(2)}>
            I built this tool to run my own rental properties in Lagos. I&apos;ve opened up a demo copy so you can look
            around.
          </p>

          <div className="mt-8 flex animate-rise-in flex-wrap items-center gap-x-5 gap-y-3" style={rise(3)}>
            <Button onClick={handleContinue} className="group px-5">
              Continue
              <ArrowRight
                aria-hidden
                className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-0.5"
              />
            </Button>
            <p className="flex items-center gap-1.5 text-meta-style">
              <RotateCcw aria-hidden className="size-3.5" /> The data resets every night.
            </p>
          </div>
        </div>

        <figure
          aria-label="Preview: today's rent status for three tenants"
          className="animate-rise-in rounded-lg border border-border bg-surface shadow-2"
          style={rise(2)}
        >
          <div className="flex items-baseline justify-between border-b border-border px-5 py-4">
            <div>
              <p className="text-meta-style">Monthly rent roll</p>
              <p className="text-stat-sm font-semibold tabular-nums">₦1,370,000</p>
            </div>
            <p className="text-meta-style">4 properties, 9 of 11 beds</p>
          </div>
          <ul className="divide-y divide-border">
            {PREVIEW.map((row, i) => (
              <li
                key={row.name}
                className="flex animate-row-in items-center gap-3 px-5 py-3.5"
                style={{ "--row": i + 4 } as React.CSSProperties}
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-meta font-semibold text-muted-foreground"
                >
                  {row.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.name}</p>
                  <p className="truncate text-meta-style">{row.place}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-medium tabular-nums">{row.amount}</span>
                  <RentStatusPill status={row.status} />
                </div>
              </li>
            ))}
          </ul>
          <figcaption className="border-t border-border px-5 py-3 text-meta-style">
            Reminders go out on WhatsApp, 3 days before, on the day and at 3 days late.
          </figcaption>
        </figure>
      </div>
    </main>
  );
}
