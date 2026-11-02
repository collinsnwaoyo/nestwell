import { format } from "date-fns";
import { MessageStatusPill } from "@/components/ui/status-pill";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import type { MessageRow as MessageRowData } from "@/lib/db/queries";

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
    <div className="flex flex-col gap-2 rounded-lg bg-surface-sunk p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{message.recipientName}</p>
          <p className="truncate text-meta-style">
            {[message.propertyName, message.roomName].filter(Boolean).join(" · ") || message.phone}
          </p>
        </div>
        <MessageStatusPill status={message.status} />
      </div>

      <p className="">{message.body}</p>

      <div className="flex items-center justify-between gap-3">
        <p className="text-meta-style">
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
