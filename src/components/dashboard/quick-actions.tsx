"use client";

import Link from "next/link";
import { useCallback, useState, type ComponentType } from "react";
import { format } from "date-fns";
import { AlarmClock, ArrowLeft, ArrowRight, BedDouble, ChevronRight, MessageCircle, Wallet } from "lucide-react";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import { RentStatusPill } from "@/components/ui/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { RecordPaymentButton } from "@/components/property/record-payment-button";
import { formatNaira, toLagosDate } from "@/lib/domain";
import type { OverdueTenancy, PayableTenancy, VacantBed } from "@/lib/db/queries";

type Panel = "record-payment" | "overdue" | "add-tenant" | null;

function dueLabel(item: PayableTenancy) {
  if (item.daysUntilDue < 0) return `${-item.daysUntilDue} day${item.daysUntilDue === -1 ? "" : "s"} late`;
  if (item.daysUntilDue === 0) return "Due today";
  return `Due ${format(toLagosDate(item.nextDueDate), "d MMM")}`;
}

function ActionCard({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-16 overflow-hidden rounded-lg bg-card px-3.5 py-3 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:px-4"
    >
      <span className="relative flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap sm:text-[15px]">
        {label}
        {/* Hidden on phones so two-word labels stay on one line in the half-width card. */}
        <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
      </span>
      <Icon className="absolute -right-1.5 -bottom-3 size-12 text-muted-foreground/30" strokeWidth={1.25} />
    </button>
  );
}

function PanelRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg bg-background px-4 py-3 transition-colors hover:bg-accent"
    >
      {children}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function QuickActions({
  payable,
  overdue,
  vacantBeds,
  tenantCount,
}: {
  payable: PayableTenancy[];
  overdue: OverdueTenancy[];
  vacantBeds: VacantBed[];
  tenantCount: number;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  // A snapshot, not a lookup: after recording, the refreshed data moves on to next
  // month, but the panel should keep showing the period that was just paid.
  const [paying, setPaying] = useState<PayableTenancy | null>(null);
  const [recorded, setRecorded] = useState(false);
  const choose = useCallback((item: PayableTenancy | null) => {
    setPaying(item);
    setRecorded(false);
  }, []);
  const close = useCallback(() => {
    setPanel(null);
    choose(null);
  }, [choose]);

  const titles: Record<Exclude<Panel, null>, string> = {
    "record-payment": "Record payment",
    overdue: "Overdue rent",
    "add-tenant": "Add a tenant",
  };
  const descriptions: Record<Exclude<Panel, null>, string> = {
    "record-payment": "One month's rent at a time. Soonest due first.",
    overdue: `${overdue.length} tenant${overdue.length === 1 ? "" : "s"} behind on rent`,
    "add-tenant": `${vacantBeds.length} vacant bed${vacantBeds.length === 1 ? "" : "s"}`,
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <BroadcastComposer
          scopeType="portfolio"
          scopeId={null}
          scopeLabel={`Whole portfolio, ${tenantCount} tenant${tenantCount === 1 ? "" : "s"}`}
          renderTrigger={(open) => <ActionCard label="Send message" icon={MessageCircle} onClick={open} />}
        />
        <ActionCard label="Record payment" icon={Wallet} onClick={() => setPanel("record-payment")} />
        <ActionCard label="View overdue" icon={AlarmClock} onClick={() => setPanel("overdue")} />
        <ActionCard label="Add a tenant" icon={BedDouble} onClick={() => setPanel("add-tenant")} />
      </div>

      <Drawer
        open={panel !== null}
        onClose={close}
        title={panel ? titles[panel] : ""}
        description={panel ? descriptions[panel] : undefined}
      >
        {panel === "record-payment" &&
          (paying ? (
            <div className="flex flex-col gap-5">
              <button
                type="button"
                onClick={() => choose(null)}
                className="flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> All tenants
              </button>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">{paying.tenantName}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {paying.propertyName} · {paying.roomName}
                  </p>
                </div>
                <RentStatusPill status={recorded ? "paid" : paying.status} />
              </div>
              <dl className="divide-y divide-border rounded-lg bg-background text-sm">
                <div className="flex justify-between gap-3 px-4 py-3">
                  <dt className="text-muted-foreground">Rent for period</dt>
                  <dd className="tabular-nums">{format(toLagosDate(paying.nextDueDate), "d MMM yyyy")}</dd>
                </div>
                <div className="flex justify-between gap-3 px-4 py-3">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-medium tabular-nums">{formatNaira(paying.rent)}</dd>
                </div>
                {paying.balance > paying.rent && (
                  <div className="flex justify-between gap-3 px-4 py-3">
                    <dt className="text-muted-foreground">Total owed</dt>
                    <dd className="tabular-nums">{formatNaira(paying.balance)}</dd>
                  </div>
                )}
              </dl>
              <RecordPaymentButton
                key={paying.tenancyId}
                tenancyId={paying.tenancyId}
                startChoosing
                onRecorded={() => setRecorded(true)}
              />
            </div>
          ) : payable.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">No tenants yet. Fill a vacant bed first.</p>
              <Button type="button" variant="outline" onClick={() => setPanel("add-tenant")}>
                Add a tenant
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {payable.map((item) => (
                <button
                  key={item.tenancyId}
                  type="button"
                  onClick={() => choose(item)}
                  className="flex items-center gap-3 rounded-lg bg-background px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.tenantName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.propertyName} · {dueLabel(item)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium tabular-nums">
                      {formatNaira(item.balance > 0 ? item.balance : item.rent)}
                    </span>
                    <RentStatusPill status={item.status} />
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          ))}

        {panel === "overdue" &&
          (overdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody is overdue. Everyone is within their grace period.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {overdue.map((item) => (
                <PanelRow key={item.bedId} href={`/properties/${item.propertyId}?bed=${item.bedId}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.tenantName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.propertyName} · {item.roomName} · {item.daysLate} day{item.daysLate === 1 ? "" : "s"}{" "}
                      late
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium tabular-nums">{formatNaira(item.balance)}</span>
                    <RentStatusPill status="overdue" />
                  </div>
                </PanelRow>
              ))}
            </div>
          ))}

        {panel === "add-tenant" &&
          (vacantBeds.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                Every bed is filled. Add a room from a property&apos;s Configure rooms.
              </p>
              <Link href="/properties" className={buttonVariants({ variant: "outline" })}>
                Go to properties
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {vacantBeds.map((bed) => (
                <PanelRow key={bed.bedId} href={`/properties/${bed.propertyId}?bed=${bed.bedId}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{bed.propertyName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {bed.roomName} · {bed.bedLabel} · {formatNaira(bed.rentPerBed)}/month
                    </p>
                  </div>
                  <RentStatusPill status="vacant" />
                </PanelRow>
              ))}
            </div>
          ))}
      </Drawer>
    </>
  );
}
