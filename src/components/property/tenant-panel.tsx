"use client";

import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import { AlertTriangle, Bell, LogOut, MessageCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatNaira, formatTimestamp, toLagosDate } from "@/lib/domain";
import type { BedDetail } from "@/lib/db/queries";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Menu, type MenuItem } from "@/components/ui/popover";
import { MessageStatusPill, MessageTypePill, StatusPill } from "@/components/ui/status-pill";
import { AddTenantForm } from "./add-tenant-form";
import { CheckOutForm } from "./check-out-form";
import { EditTenantForm } from "./edit-tenant-form";
import { IssueNoticeForm } from "./issue-notice-form";
import { PushReminderButton } from "./push-reminder-button";
import { RecordPaymentButton } from "./record-payment-button";

type Mode = "reminder" | "notice" | "checkout" | null;

const DUE_STATUSES = ["due_soon", "due_today", "overdue"];

function Detail({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-meta-style">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function BalanceBlock({ bed }: { bed: BedDetail }) {
  const tone = bed.balance === 0 ? "text-positive" : bed.status === "due_today" ? "text-warning" : "text-danger";
  const note =
    bed.balance === 0
      ? `Up to date${bed.nextDueDate ? `, next due ${formatDate(bed.nextDueDate)}` : ""}`
      : bed.status === "due_today"
        ? "Due today"
        : `Overdue since ${bed.nextDueDate ? format(toLagosDate(bed.nextDueDate), "d MMM") : "last due date"}`;
  return (
    <div className="rounded-lg bg-surface-sunk px-4 py-3.5">
      <p className="text-meta-style">Balance</p>
      <AnimatedNumber value={bed.balance} format={formatNaira} className={cn("block text-stat-sm font-semibold", tone)} />
      <p className="text-meta-style">{note}</p>
    </div>
  );
}

/**
 * Body of the tenant drawer. The parent keys it by bed id (so inline forms
 * reset per tenant) and owns `editing`, since Edit lives in the drawer header.
 */
export function TenantPanelContent({
  bed,
  propertyId,
  rentPerBed,
  editing,
  onEditingChange,
  onClose,
}: {
  bed: BedDetail;
  propertyId: string;
  rentPerBed: number;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>(null);

  if (!bed.tenant) {
    return <AddTenantForm bedId={bed.id} rentPerBed={rentPerBed} onDone={onClose} />;
  }

  if (editing) {
    return (
      <EditTenantForm
        tenant={bed.tenant}
        propertyId={propertyId}
        onDone={() => onEditingChange(false)}
        onCancel={() => onEditingChange(false)}
      />
    );
  }

  const tenant = bed.tenant;
  const moreActions: MenuItem[] = [];
  if (bed.tenancyId && DUE_STATUSES.includes(bed.status)) {
    moreActions.push({ label: "Push reminder", icon: <Bell aria-hidden className="size-4" />, onSelect: () => setMode("reminder") });
  }
  if (bed.tenancyStatus === "active") {
    moreActions.push({
      label: "Issue notice",
      icon: <AlertTriangle aria-hidden className="size-4" />,
      onSelect: () => setMode("notice"),
      tone: "danger",
    });
  }
  if (bed.tenancyStatus === "active" || bed.tenancyStatus === "notice") {
    moreActions.push({ label: "Check out", icon: <LogOut aria-hidden className="size-4" />, onSelect: () => setMode("checkout") });
  }

  // The emergency contact usually repeats next of kin; only show it when it adds something.
  const emergencyIsKin = tenant.emergencyContact.trim().startsWith(tenant.nextOfKinName.trim());

  return (
    <div className="flex flex-col gap-6">
      {!tenant.verified && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <StatusPill tone="warning">Unverified</StatusPill>
          Documents haven&apos;t been checked yet.
        </div>
      )}

      <BalanceBlock bed={bed} />

      {bed.tenancyStatus === "notice" && (
        <div className="flex flex-col gap-1.5 rounded-lg bg-danger-bg px-4 py-3">
          <p className="flex items-center gap-1.5 font-medium text-danger">
            <AlertTriangle aria-hidden className="size-4" /> Notice issued, move out by{" "}
            {bed.moveOut && formatDate(bed.moveOut)}
          </p>
          {bed.noticeReason && <p className="text-muted-foreground">{bed.noticeReason}</p>}
        </div>
      )}

      {bed.tenancyId && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <RecordPaymentButton tenancyId={bed.tenancyId} fullWidth />
            <BroadcastComposer
              scopeType="tenant"
              scopeId={bed.tenancyId}
              scopeLabel={tenant.fullName}
              renderTrigger={(open) => (
                <Button type="button" variant="secondary" onClick={open} className="w-full">
                  <MessageCircle aria-hidden /> Message
                </Button>
              )}
            />
          </div>
          {moreActions.length > 0 && mode === null && (
            <Menu
              label="More actions"
              align="start"
              items={moreActions}
              trigger={({ ref, ...props }) => (
                <Button ref={ref} type="button" variant="ghost" className="self-start" {...props}>
                  <MoreHorizontal aria-hidden /> More actions
                </Button>
              )}
            />
          )}
          {mode === "reminder" && (
            <div className="flex flex-col items-start gap-2 rounded-lg bg-surface-sunk p-4">
              <p className="font-semibold">Reminder</p>
              <PushReminderButton tenancyId={bed.tenancyId} autoStart />
              <Button type="button" variant="ghost" size="compact" onClick={() => setMode(null)}>
                Done
              </Button>
            </div>
          )}
          {mode === "notice" && <IssueNoticeForm tenancyId={bed.tenancyId} onCancel={() => setMode(null)} />}
          {mode === "checkout" && (
            <CheckOutForm tenancyId={bed.tenancyId} defaultMoveOut={bed.moveOut} onCancel={() => setMode(null)} />
          )}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Detail label="Phone">
          <span className="tabular-nums">{tenant.phone}</span>
        </Detail>
        <Detail label="Email">
          <span className="flex items-center gap-1">
            <span className="min-w-0 truncate" title={tenant.email}>
              {tenant.email}
            </span>
            <CopyButton value={tenant.email} label="Email" />
          </span>
        </Detail>
        <Detail label="Occupation">{tenant.occupation}</Detail>
        <Detail label="Move-in">{bed.moveIn && formatDate(bed.moveIn)}</Detail>
        <Detail label="Rent">
          <span className="tabular-nums">{bed.rent && formatNaira(bed.rent)}/month</span>
        </Detail>
        <Detail label="Next due date">{bed.nextDueDate && formatDate(bed.nextDueDate)}</Detail>
        <Detail label="Next of kin" className="col-span-2">
          {tenant.nextOfKinName} ({tenant.nextOfKinRelation}),{" "}
          <span className="tabular-nums">{tenant.nextOfKinPhone}</span>
        </Detail>
        {!emergencyIsKin && (
          <Detail label="Emergency contact" className="col-span-2">
            <span className="tabular-nums">{tenant.emergencyContact}</span>
          </Detail>
        )}
      </dl>

      <section>
        <h3 className="mb-2 text-h3 font-semibold">Payment history</h3>
        {bed.payments.length === 0 ? (
          <p className="text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-2">
            {bed.payments
              .slice()
              .reverse()
              .map((payment) => (
                <div key={payment.id} className="col-span-3 grid grid-cols-subgrid">
                  <span>{format(toLagosDate(payment.periodMonth), "MMMM yyyy")}</span>
                  <span className="text-muted-foreground capitalize">{payment.method}</span>
                  <span className="text-right font-medium tabular-nums">{formatNaira(payment.amount)}</span>
                </div>
              ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-h3 font-semibold">Messages sent</h3>
        {bed.messages.length === 0 ? (
          <p className="text-muted-foreground">No messages sent yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bed.messages.map((message) => (
              <li key={message.id} className="rounded-lg bg-surface-sunk p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <MessageTypePill template={message.template} />
                  <MessageStatusPill status={message.status} />
                </div>
                <p className="max-w-[70ch]">{message.body}</p>
                <p className="mt-1.5 text-meta-style capitalize">
                  {message.trigger} · {formatTimestamp(message.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
