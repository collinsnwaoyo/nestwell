"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import { pushReminder, type PushReminderResult } from "@/lib/actions/reminders";

/**
 * Prepares the right reminder for where the tenant stands (due soon, due
 * today or overdue), then hands over to the WhatsApp send flow.
 * `autoStart` prepares it straight away (when picked from a menu).
 */
export function PushReminderButton({
  tenancyId,
  label = "Push reminder",
  variant = "secondary",
  size = "default",
  autoStart = false,
}: {
  tenancyId: string;
  label?: string;
  variant?: "secondary" | "ghost";
  size?: "default" | "compact";
  autoStart?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PushReminderResult | null>(null);
  const started = useRef(false);

  function send() {
    startTransition(async () => {
      const outcome = await pushReminder(tenancyId);
      if (outcome.error || !outcome.data) {
        toast.error(outcome.error ?? "Couldn't prepare the reminder.");
        return;
      }
      setResult(outcome.data);
      toast.success("Reminder ready to send");
      router.refresh();
    });
  }

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      send();
    }
    // Runs once on mount when autoStart is set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  if (result) {
    return <WhatsAppSendButton messageId={result.messageId} waLink={result.waLink} label="Send reminder" />;
  }

  return (
    <Button type="button" variant={variant} size={size} disabled={pending} onClick={send}>
      <Bell aria-hidden /> {pending ? "Preparing…" : label}
    </Button>
  );
}
