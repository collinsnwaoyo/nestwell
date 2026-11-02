import { format } from "date-fns";
import { cn } from "cn";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import type { MessageRow as MessageRowData } from "@/lib/db/queries";

const STATUS_LABELS: Record<string, string> = {
  ready: "Ready",
  opened: "Opened in WhatsApp",
  marked_sent: "Marked sent",
};

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  opened: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  marked_sent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const TRIGGER_LABELS: Record<string, string> = {
  auto: "Automatic",
  manual: "Manual",
  broadcast: "Broadcast",
};

const TEMPLATE_LABELS: Record<string, string> = {
  due_soon: "Due soon",
  due_today: "Due today",
  overdue: "Overdue",
  receipt: "Receipt",
  notice: "Notice",
};

export function MessageRow({ message }: { message: MessageRowData }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{message.recipientName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[message.propertyName, message.roomName].filter(Boolean).join(" · ") || message.phone}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap",
            STATUS_STYLES[message.status] ?? "bg-muted text-muted-foreground",
          )}
        >
          {STATUS_LABELS[message.status] ?? message.status}
        </span>
      </div>

      <p className="text-sm">{message.body}</p>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {TEMPLATE_LABELS[message.template] ?? message.template} · {TRIGGER_LABELS[message.trigger] ?? message.trigger} ·{" "}
          {format(new Date(message.createdAt), "d MMM, h:mma")}
        </p>
        {message.status !== "marked_sent" && (
          <WhatsAppSendButton
            messageId={message.id}
            waLink={message.waLink}
            label="Send"
            initialStatus={message.status}
          />
        )}
      </div>
    </div>
  );
}
