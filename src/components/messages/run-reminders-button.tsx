"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runRemindersNow } from "@/lib/actions/reminder-job";

export function RunRemindersButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await runRemindersNow();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const sent = result.data?.sent ?? 0;
      toast.success(sent === 0 ? "No reminders due today" : `${sent} reminder${sent === 1 ? "" : "s"} prepared`);
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="secondary" disabled={pending} onClick={handleClick} className="gap-1.5">
      <Zap className="size-4" /> {pending ? "Running…" : "Run today's reminders"}
    </Button>
  );
}
