"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import { recordPayment, undoPayment, type RecordPaymentResult } from "@/lib/actions/payments";
import type { PaymentMethod } from "@/lib/db/types";

/**
 * Record one month's rent: pick transfer or cash, then send the receipt.
 * The success toast carries an Undo for the next four seconds.
 * `startChoosing` skips the first tap where the tenant was just picked.
 * `onRecordedChange` reports true after recording and false after an undo.
 */
export function RecordPaymentButton({
  tenancyId,
  startChoosing = false,
  fullWidth = false,
  onRecordedChange,
}: {
  tenancyId: string;
  startChoosing?: boolean;
  fullWidth?: boolean;
  onRecordedChange?: (recorded: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choosing, setChoosing] = useState(startChoosing);
  const [result, setResult] = useState<RecordPaymentResult | null>(null);

  function undo(recorded: RecordPaymentResult) {
    startTransition(async () => {
      const outcome = await undoPayment(recorded.paymentId, recorded.messageId);
      if (outcome.error) {
        toast.error(outcome.error);
        return;
      }
      setResult(null);
      setChoosing(true);
      onRecordedChange?.(false);
      toast.success("Payment undone");
      router.refresh();
    });
  }

  function record(method: PaymentMethod) {
    startTransition(async () => {
      const outcome = await recordPayment(tenancyId, method);
      if (outcome.error || !outcome.data) {
        toast.error(outcome.error ?? "Couldn't record the payment.");
        return;
      }
      const recorded = outcome.data;
      setChoosing(false);
      setResult(recorded);
      onRecordedChange?.(true);
      toast.success("Payment recorded", { action: { label: "Undo", onClick: () => undo(recorded) } });
      router.refresh();
    });
  }

  if (result) {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-surface-sunk p-4">
        <p className="font-medium">Receipt ready</p>
        <WhatsAppSendButton messageId={result.messageId} waLink={result.waLink} label="Send receipt" />
      </div>
    );
  }

  if (choosing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Paid by</span>
        <Button type="button" disabled={pending} onClick={() => record("transfer")}>
          Transfer
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => record("cash")}>
          Cash
        </Button>
        {!startChoosing && (
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setChoosing(false)}>
            Cancel
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button type="button" onClick={() => setChoosing(true)} className={fullWidth ? "w-full" : undefined}>
      <Wallet aria-hidden /> Record payment
    </Button>
  );
}
