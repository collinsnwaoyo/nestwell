"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { RentStatusPill } from "@/components/ui/status-pill";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import { issueNotice, type IssueNoticeResult } from "@/lib/actions/notices";

/** Inline notice form inside the tenant drawer. Notice is never issued automatically. */
export function IssueNoticeForm({ tenancyId, onCancel }: { tenancyId: string; onCancel: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [moveOut, setMoveOut] = useState(format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IssueNoticeResult | null>(null);

  function submit() {
    startTransition(async () => {
      const outcome = await issueNotice(tenancyId, reason, moveOut);
      if (outcome.error) {
        setError(outcome.error);
        return;
      }
      if (outcome.data) setResult(outcome.data);
      toast.success("Notice issued");
      router.refresh();
    });
  }

  if (result) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-sunk p-4">
        <RentStatusPill status="notice" />
        <WhatsAppSendButton messageId={result.messageId} waLink={result.waLink} label="Send notice" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-surface-sunk p-4">
      <p className="font-semibold">Issue notice</p>
      <FormField label="Reason" htmlFor="notice-reason">
        <textarea
          id="notice-reason"
          className={inputClass}
          rows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
        />
      </FormField>
      <FormField label="Move-out date" htmlFor="notice-move-out">
        <input
          id="notice-move-out"
          type="date"
          className={inputClass}
          value={moveOut}
          onChange={(event) => setMoveOut(event.target.value)}
          required
        />
      </FormField>
      {error && <p className="text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="destructive" disabled={pending || !reason.trim()} onClick={submit}>
          {pending ? "Issuing…" : "Confirm notice"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
