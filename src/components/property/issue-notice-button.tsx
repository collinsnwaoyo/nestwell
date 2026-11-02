"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import { issueNotice, type IssueNoticeResult } from "@/lib/actions/notices";

export function IssueNoticeButton({ tenancyId }: { tenancyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [moveOut, setMoveOut] = useState(
    format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IssueNoticeResult | null>(null);

  function submit() {
    startTransition(async () => {
      const outcome = await issueNotice(tenancyId, reason, moveOut);
      if (outcome.error) {
        setError(outcome.error);
        return;
      }
      setOpen(false);
      if (outcome.data) setResult(outcome.data);
      toast.success("Notice issued");
      router.refresh();
    });
  }

  if (result) {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-purple-500/10 p-3">
        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Notice issued</p>
        <WhatsAppSendButton messageId={result.messageId} waLink={result.waLink} label="Send notice on WhatsApp" />
      </div>
    );
  }

  if (open) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
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
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            disabled={pending || !reason.trim()}
            onClick={submit}
            className="rounded-md"
          >
            {pending ? "Issuing…" : "Confirm notice"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-md">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
      <AlertTriangle className="size-4" /> Issue notice
    </Button>
  );
}
