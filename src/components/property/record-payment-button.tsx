"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import { recordPayment, type RecordPaymentResult } from "@/lib/actions/payments";
import type { PaymentMethod } from "@/lib/db/types";

/** `startChoosing` skips the first tap, for places where the tenant was just picked. */
export function RecordPaymentButton({
  tenancyId,
  startChoosing = false,
  onRecorded,
}: {
  tenancyId: string;
  startChoosing?: boolean;
  onRecorded?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choosing, setChoosing] = useState(startChoosing);
  const [result, setResult] = useState<RecordPaymentResult | null>(null);

  function record(method: PaymentMethod) {
    startTransition(async () => {
      const outcome = await recordPayment(tenancyId, method);
      if (outcome.error) {
        toast.error(outcome.error);
        return;
      }
      setChoosing(false);
      if (outcome.data) setResult(outcome.data);
      onRecorded?.();
      toast.success("Payment recorded");
      router.refresh();
    });
  }

  if (result) {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
        <p className="text-sm font-medium">Receipt ready</p>
        <WhatsAppSendButton
          messageId={result.messageId}
          waLink={result.waLink}
          label="Send receipt on WhatsApp"
        />
      </div>
    );
  }

  if (choosing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Paid by</span>
        <Button type="button" disabled={pending} onClick={() => record("transfer")} className="rounded-md">
          Transfer
        </Button>
        <Button
          type="button"
          disabled={pending}
          variant="outline"
          onClick={() => record("cash")}
          className="rounded-md"
        >
          Cash
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" onClick={() => setChoosing(true)} className="gap-1.5 rounded-md">
      <Wallet className="size-4" /> Record payment
    </Button>
  );
}
