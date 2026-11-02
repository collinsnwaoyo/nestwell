"use client";

import { useMemo, useState } from "react";
import { inputClass } from "@/components/ui/form";
import type { MessageRow as MessageRowData } from "@/lib/db/queries";
import { MessageRow } from "./message-row";

const TRIGGER_LABELS: Record<string, string> = { auto: "Automatic", manual: "Manual", broadcast: "Broadcast" };
const TEMPLATE_LABELS: Record<string, string> = {
  due_soon: "Due soon",
  due_today: "Due today",
  overdue: "Overdue",
  receipt: "Receipt",
  notice: "Notice",
};

export function MessagesList({ messages }: { messages: MessageRowData[] }) {
  const [property, setProperty] = useState("all");
  const [recipient, setRecipient] = useState("all");
  const [template, setTemplate] = useState("all");
  const [trigger, setTrigger] = useState("all");

  const properties = useMemo(
    () => [...new Set(messages.map((m) => m.propertyName).filter((v): v is string => !!v))].sort(),
    [messages],
  );
  const recipients = useMemo(
    () => [...new Set(messages.map((m) => m.recipientName))].sort(),
    [messages],
  );
  const templates = useMemo(() => [...new Set(messages.map((m) => m.template))], [messages]);
  const triggers = useMemo(() => [...new Set(messages.map((m) => m.trigger))], [messages]);

  const filtered = messages.filter(
    (message) =>
      (property === "all" || message.propertyName === property) &&
      (recipient === "all" || message.recipientName === recipient) &&
      (template === "all" || message.template === template) &&
      (trigger === "all" || message.trigger === trigger),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select className={inputClass} value={property} onChange={(e) => setProperty(e.target.value)}>
          <option value="all">All properties</option>
          {properties.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select className={inputClass} value={recipient} onChange={(e) => setRecipient(e.target.value)}>
          <option value="all">All tenants</option>
          {recipients.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select className={inputClass} value={template} onChange={(e) => setTemplate(e.target.value)}>
          <option value="all">All types</option>
          {templates.map((value) => (
            <option key={value} value={value}>
              {TEMPLATE_LABELS[value] ?? value}
            </option>
          ))}
        </select>
        <select className={inputClass} value={trigger} onChange={(e) => setTrigger(e.target.value)}>
          <option value="all">All triggers</option>
          {triggers.map((value) => (
            <option key={value} value={value}>
              {TRIGGER_LABELS[value] ?? value}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No messages match these filters.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((message) => (
            <MessageRow key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}
