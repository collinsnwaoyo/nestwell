"use client";

import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { AlarmClock, ArrowLeft, BedDouble, ChevronRight, MessageCircle, Wallet } from "lucide-react";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import { RentStatusPill } from "@/components/ui/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { RecordPaymentButton } from "@/components/property/record-payment-button";
import { describeDue, formatNaira, toLagosDate } from "@/lib/domain";
import type { OverdueTenancy, PayableTenancy, VacantBed } from "@/lib/db/queries";

type Panel = "record-payment" | "overdue" | "add-tenant" | null;

const ACTION_CLASS = "w-full justify-start gap-3 px-2.5 text-foreground";

/** A row inside a quick-action drawer: a list item with a chevron, on the drawer's sunk inset. */
function PanelRow({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const className =
    "flex w-full items-center gap-3 rounded-lg bg-surface-sunk px-4 py-3 text-left transition-colors duration-(--dur-1) hover:bg-neutral-bg";
  const content = (
    <>
      {children}
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
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
      <div className="flex flex-col gap-0.5">
        <BroadcastComposer
          scopeType="portfolio"
          scopeId={null}
          scopeLabel={`Whole portfolio, ${tenantCount} tenant${tenantCount === 1 ? "" : "s"}`}
          renderTrigger={(open) => (
            <Button type="button" variant="ghost" onClick={open} className={ACTION_CLASS}>
              <MessageCircle aria-hidden className="text-muted-foreground" /> Send message
            </Button>
          )}
        />
        <Button type="button" variant="ghost" onClick={() => setPanel("record-payment")} className={ACTION_CLASS}>
          <Wallet aria-hidden className="text-muted-foreground" /> Record payment
        </Button>
        <Button type="button" variant="ghost" onClick={() => setPanel("overdue")} className={ACTION_CLASS}>
          <AlarmClock aria-hidden className="text-muted-foreground" /> View overdue
        </Button>
        <Button type="button" variant="ghost" onClick={() => setPanel("add-tenant")} className={ACTION_CLASS}>
          <BedDouble aria-hidden className="text-muted-foreground" /> Add a tenant
        </Button>
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
              <Button type="button" variant="ghost" size="compact" onClick={() => choose(null)} className="-ml-2 self-start">
                <ArrowLeft aria-hidden /> All tenants
              </Button>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-h3 font-semibold">{paying.tenantName}</p>
                  <p className="truncate text-meta-style">
                    {paying.propertyName} · {paying.roomName}
                  </p>
                </div>
                <RentStatusPill status={recorded ? "paid" : paying.status} />
              </div>
              <dl className="divide-y divide-border rounded-lg bg-surface-sunk">
                <div className="flex justify-between gap-3 px-4 py-3">
                  <dt className="text-muted-foreground">Rent for period</dt>
                  <dd>{format(toLagosDate(paying.nextDueDate), "d MMM yyyy")}</dd>
                </div>
                <div className="flex justify-between gap-3 px-4 py-3">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-medium">{formatNaira(paying.rent)}</dd>
                </div>
                {paying.balance > paying.rent && (
                  <div className="flex justify-between gap-3 px-4 py-3">
                    <dt className="text-muted-foreground">Total owed</dt>
                    <dd>{formatNaira(paying.balance)}</dd>
                  </div>
                )}
              </dl>
              <RecordPaymentButton
                key={paying.tenancyId}
                tenancyId={paying.tenancyId}
                startChoosing
                onRecordedChange={setRecorded}
              />
            </div>
          ) : payable.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground">No tenants yet. Fill a vacant bed first.</p>
              <Button type="button" variant="secondary" onClick={() => setPanel("add-tenant")}>
                Add a tenant
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {payable.map((item) => (
                <li key={item.tenancyId}>
                  <PanelRow onClick={() => choose(item)}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.tenantName}</p>
                      <p className="truncate text-meta-style">
                        {item.propertyName} · {describeDue(item.daysUntilDue, item.nextDueDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-medium tabular-nums">
                        {formatNaira(item.balance > 0 ? item.balance : item.rent)}
                      </span>
                      <RentStatusPill status={item.status} />
                    </div>
                  </PanelRow>
                </li>
              ))}
            </ul>
          ))}

        {panel === "overdue" &&
          (overdue.length === 0 ? (
            <p className="text-muted-foreground">Nobody is overdue. Everyone is within their grace period.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {overdue.map((item) => (
                <li key={item.bedId}>
                  <PanelRow href={`/properties/${item.propertyId}?bed=${item.bedId}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.tenantName}</p>
                      <p className="truncate text-meta-style">
                        {item.propertyName} · {item.roomName} · {item.daysLate} day{item.daysLate === 1 ? "" : "s"}{" "}
                        late
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-medium tabular-nums">{formatNaira(item.balance)}</span>
                      <RentStatusPill status="overdue" />
                    </div>
                  </PanelRow>
                </li>
              ))}
            </ul>
          ))}

        {panel === "add-tenant" &&
          (vacantBeds.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground">Every bed is filled. Add a room from a property&apos;s Configure rooms.</p>
              <Link href="/properties" className={buttonVariants({ variant: "secondary" })}>
                Go to properties
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {vacantBeds.map((bed) => (
                <li key={bed.bedId}>
                  <PanelRow href={`/properties/${bed.propertyId}?bed=${bed.bedId}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{bed.propertyName}</p>
                      <p className="truncate text-meta-style tabular-nums">
                        {bed.roomName} · {formatNaira(bed.rentPerBed)}/month
                      </p>
                    </div>
                    <RentStatusPill status="vacant" />
                  </PanelRow>
                </li>
              ))}
            </ul>
          ))}
      </Drawer>
    </>
  );
}
