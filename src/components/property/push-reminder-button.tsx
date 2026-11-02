"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import { pushReminder, type PushReminderResult } from "@/lib/actions/reminders";

export function PushReminderButton({ tenancyId }: { tenancyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PushReminderResult | null>(null);

  function send() {
    startTransition(async () => {
      const outcome = await pushReminder(tenancyId);
      if (outcome.error) {
        toast.error(outcome.error);
        return;
      }
      if (outcome.data) setResult(outcome.data);
      toast.success("Reminder ready to send");
      router.refresh();
    });
  }

  if (result) {
    return (
      <WhatsAppSendButton
        messageId={result.messageId}
        waLink={result.waLink}
        label="Send reminder on WhatsApp"
      />
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={send}
      className="gap-1.5 rounded-md"
    >
      <Bell className="size-4" /> {pending ? "Preparing…" : "Push reminder"}
    </Button>
  );
}
