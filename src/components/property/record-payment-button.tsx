"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import { recordPayment, type RecordPaymentResult } from "@/lib/actions/payments";
import type { PaymentMethod } from "@/lib/db/types";

export function RecordPaymentButton({ tenancyId }: { tenancyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choosing, setChoosing] = useState(false);
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
      toast.success("Payment recorded");
      router.refresh();
    });
  }

  if (result) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3">
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
        <Button type="button" disabled={pending} onClick={() => record("transfer")} className="rounded-full">
          Transfer
        </Button>
        <Button
          type="button"
          disabled={pending}
          variant="outline"
          onClick={() => record("cash")}
          className="rounded-full"
        >
          Cash
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" onClick={() => setChoosing(true)} className="gap-1.5 rounded-full">
      <Wallet className="size-4" /> Record payment
    </Button>
  );
}
