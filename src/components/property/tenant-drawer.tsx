"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { StatusChip } from "@/components/status-chip";
import { Sheet } from "@/components/ui/sheet";
import type { BedDetail } from "@/lib/db/queries";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import { AddTenantForm } from "./add-tenant-form";
import { CheckOutButton } from "./check-out-button";
import { EditTenantForm } from "./edit-tenant-form";
import { IssueNoticeButton } from "./issue-notice-button";
import { PushReminderButton } from "./push-reminder-button";
import { RecordPaymentButton } from "./record-payment-button";

function formatDate(iso: string) {
  return format(new Date(iso), "d MMM yyyy");
}

export function TenantDrawer({
  bed,
  propertyId,
  roomName,
  rentPerBed,
  onClose,
}: {
  bed: BedDetail | null;
  propertyId: string;
  roomName: string;
  rentPerBed: number;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!bed) setEditing(false);
  }, [bed]);

  return (
    <Sheet
      open={bed !== null}
      onClose={onClose}
      title={bed?.tenant ? bed.tenant.fullName : "Add tenant"}
      description={bed && `${roomName} · ${bed.label}`}
    >
      {bed && !bed.tenant ? (
        <AddTenantForm bedId={bed.id} rentPerBed={rentPerBed} onDone={onClose} />
      ) : bed && bed.tenant && editing ? (
        <EditTenantForm
          tenant={bed.tenant}
          propertyId={propertyId}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        bed &&
        bed.tenant && (
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-3.5" /> Edit tenant
            </button>

            {!bed.tenant.verified && (
              <div className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                Verification pending — documents haven&apos;t been checked yet.
              </div>
            )}

            <div className="flex items-center justify-between rounded-[20px] bg-muted/50 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-semibold tabular-nums">{formatNaira(bed.balance)}</p>
              </div>
              {bed.status !== "paid" && <StatusChip status={bed.status} />}
            </div>

            {bed.tenancyStatus === "notice" && (
              <div className="rounded-xl bg-purple-500/10 px-3 py-2 text-xs text-purple-700 dark:text-purple-300">
                <p className="font-medium">On notice — move out by {bed.moveOut && formatDate(bed.moveOut)}</p>
                {bed.noticeReason && <p className="mt-0.5">{bed.noticeReason}</p>}
              </div>
            )}

            {bed.tenancyId && (
              <div className="flex flex-col gap-2">
                <RecordPaymentButton tenancyId={bed.tenancyId} />
                {(bed.status === "due_soon" || bed.status === "due_today" || bed.status === "overdue") && (
                  <PushReminderButton tenancyId={bed.tenancyId} />
                )}
                {bed.tenancyStatus === "active" && <IssueNoticeButton tenancyId={bed.tenancyId} />}
                {(bed.tenancyStatus === "active" || bed.tenancyStatus === "notice") && (
                  <CheckOutButton tenancyId={bed.tenancyId} defaultMoveOut={bed.moveOut} />
                )}
                <BroadcastComposer
                  scopeType="tenant"
                  scopeId={bed.tenancyId}
                  scopeLabel={bed.tenant.fullName}
                  triggerClassName="w-fit gap-1.5 rounded-full"
                />
              </div>
            )}

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="tabular-nums">{bed.tenant.phone}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate">{bed.tenant.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Occupation</dt>
                <dd>{bed.tenant.occupation}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Move-in</dt>
                <dd>{bed.moveIn && formatDate(bed.moveIn)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Rent</dt>
                <dd className="tabular-nums">{bed.rent && formatNaira(bed.rent)}/month</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Next due date</dt>
                <dd>{bed.nextDueDate && formatDate(bed.nextDueDate)}</dd>
              </div>
            </dl>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Next of kin</h3>
              <p className="text-sm">
                {bed.tenant.nextOfKinName} ({bed.tenant.nextOfKinRelation}) ·{" "}
                <span className="tabular-nums">{bed.tenant.nextOfKinPhone}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Emergency contact: <span className="tabular-nums">{bed.tenant.emergencyContact}</span>
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Payment history</h3>
              {bed.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {bed.payments
                    .slice()
                    .reverse()
                    .map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm">
                        <span>{format(new Date(payment.periodMonth), "MMMM yyyy")}</span>
                        <span className="text-muted-foreground capitalize">{payment.method}</span>
                        <span className="tabular-nums font-medium">{formatNaira(payment.amount)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Messages sent</h3>
              {bed.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages sent yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {bed.messages.map((message) => (
                    <div key={message.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{message.trigger}</span>
                        <span className="capitalize">{message.status.replace("_", " ")}</span>
                      </div>
                      <p>{message.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}
    </Sheet>
  );
}
