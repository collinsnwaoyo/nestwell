"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { checkOutTenant } from "@/lib/actions/checkout";
import type { DepositOutcome } from "@/lib/db/types";

const DEPOSIT_OPTIONS: { value: DepositOutcome; label: string }[] = [
  { value: "refund", label: "Refund in full" },
  { value: "partial", label: "Part-deduct" },
  { value: "kept", label: "Keep deposit" },
];

export function CheckOutButton({
  tenancyId,
  defaultMoveOut,
}: {
  tenancyId: string;
  defaultMoveOut?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [moveOut, setMoveOut] = useState(
    defaultMoveOut ? defaultMoveOut.slice(0, 10) : format(new Date(), "yyyy-MM-dd"),
  );
  const [depositOutcome, setDepositOutcome] = useState<DepositOutcome>("refund");
  const [deductionReason, setDeductionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    startTransition(async () => {
      const outcome = await checkOutTenant(tenancyId, moveOut, depositOutcome, deductionReason);
      if (outcome.error) {
        setError(outcome.error);
        return;
      }
      toast.success("Tenant checked out — bed is now vacant");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <LogOut className="size-4" /> Check out
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <FormField label="Move-out date" htmlFor="checkout-move-out">
        <input
          id="checkout-move-out"
          type="date"
          className={inputClass}
          value={moveOut}
          onChange={(event) => setMoveOut(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Deposit" htmlFor="checkout-deposit">
        <select
          id="checkout-deposit"
          className={inputClass}
          value={depositOutcome}
          onChange={(event) => setDepositOutcome(event.target.value as DepositOutcome)}
        >
          {DEPOSIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
      {depositOutcome === "partial" && (
        <FormField label="Deduction reason" htmlFor="checkout-reason">
          <textarea
            id="checkout-reason"
            className={inputClass}
            rows={2}
            value={deductionReason}
            onChange={(event) => setDeductionReason(event.target.value)}
            required
          />
        </FormField>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="destructive" disabled={pending} onClick={submit} className="rounded-md">
          {pending ? "Checking out…" : "Confirm check-out"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-md">
          Cancel
        </Button>
      </div>
    </div>
  );
}
