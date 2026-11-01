"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { format } from "date-fns";
import { formatNaira } from "@/lib/domain";
import { StatusChip } from "@/components/status-chip";
import type { BedDetail } from "@/lib/db/queries";

function formatDate(iso: string) {
  return format(new Date(iso), "d MMM yyyy");
}

export function TenantDrawer({
  bed,
  roomName,
  onClose,
}: {
  bed: BedDetail | null;
  roomName: string;
  onClose: () => void;
}) {
  const open = bed !== null;

  return (
    <AnimatePresence>
      {open && bed && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-background p-6 shadow-xl sm:inset-x-auto sm:right-6 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-y-1/2 sm:rounded-[20px]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {roomName} · {bed.label}
                </p>
                <h2 className="text-xl font-semibold">
                  {bed.tenant ? bed.tenant.fullName : "Vacant bed"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {!bed.tenant ? (
              <p className="text-sm text-muted-foreground">
                No one lives here right now. Add a tenant to start a tenancy on this bed.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between rounded-[20px] bg-muted/50 p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-2xl font-semibold tabular-nums">{formatNaira(bed.balance)}</p>
                  </div>
                  {bed.status !== "paid" && <StatusChip status={bed.status} />}
                </div>

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
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
