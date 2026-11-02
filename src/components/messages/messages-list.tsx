"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { differenceInCalendarDays, format } from "date-fns";
import { ListFilter, X } from "lucide-react";
import { toLagosDate } from "@/lib/domain";
import type { MessageRow as MessageRowData } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";
import { Listbox } from "@/components/ui/listbox";
import { Popover } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MessageRow } from "./message-row";

type TypeFilter = "all" | "due" | "overdue" | "receipt" | "notice";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "due", label: "Due" },
  { value: "overdue", label: "Overdue" },
  { value: "receipt", label: "Receipts" },
  { value: "notice", label: "Notices" },
];

const TYPE_TEMPLATES: Record<Exclude<TypeFilter, "all">, string[]> = {
  due: ["due_soon", "due_today"],
  overdue: ["overdue"],
  receipt: ["receipt"],
  notice: ["notice"],
};

const TRIGGER_LABELS: Record<string, string> = { auto: "Automatic", manual: "Manual", broadcast: "Broadcast" };

const STAGGERED_ROWS = 8;

function dayLabel(iso: string, today: Date) {
  const days = differenceInCalendarDays(toLagosDate(today), toLagosDate(iso));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return format(toLagosDate(iso), "EEE d MMM");
}

export function MessagesList({ messages }: { messages: MessageRowData[] }) {
  const reduceMotion = useReducedMotion();
  const [type, setType] = useState<TypeFilter>("all");
  const [property, setProperty] = useState("all");
  const [recipient, setRecipient] = useState("all");
  const [trigger, setTrigger] = useState("all");
  // Rows stagger in on the page's first render only, never after a filter change.
  const [firstRender, setFirstRender] = useState(true);

  const properties = useMemo(
    () => [...new Set(messages.map((m) => m.propertyName).filter((v): v is string => !!v))].sort(),
    [messages],
  );
  const recipients = useMemo(() => [...new Set(messages.map((m) => m.recipientName))].sort(), [messages]);
  const triggers = useMemo(() => [...new Set(messages.map((m) => m.trigger))], [messages]);

  const filtered = messages.filter(
    (message) =>
      (type === "all" || TYPE_TEMPLATES[type].includes(message.template)) &&
      (property === "all" || message.propertyName === property) &&
      (recipient === "all" || message.recipientName === recipient) &&
      (trigger === "all" || message.trigger === trigger),
  );

  const today = new Date();
  const groups: { label: string; items: MessageRowData[] }[] = [];
  for (const message of filtered) {
    const label = dayLabel(message.createdAt, today);
    const group = groups[groups.length - 1];
    if (group?.label === label) group.items.push(message);
    else groups.push({ label, items: [message] });
  }

  const chips = [
    property !== "all" && { key: "property", label: property, clear: () => setProperty("all") },
    recipient !== "all" && { key: "recipient", label: recipient, clear: () => setRecipient("all") },
    trigger !== "all" && { key: "trigger", label: TRIGGER_LABELS[trigger] ?? trigger, clear: () => setTrigger("all") },
  ].filter((chip): chip is { key: string; label: string; clear: () => void } => !!chip);

  const filterKey = [type, property, recipient, trigger].join("|");
  let rowIndex = 0;

  function changeFilter<T>(set: (value: T) => void) {
    return (value: T) => {
      setFirstRender(false);
      set(value);
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl label="Message type" options={TYPE_OPTIONS} value={type} onChange={changeFilter(setType)} />
        <Popover
          label="Filter messages"
          trigger={({ ref, ...props }) => (
            <Button ref={ref} type="button" variant="secondary" {...props}>
              <ListFilter aria-hidden /> Filter
              {chips.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-meta font-semibold text-primary-foreground tabular-nums">
                  {chips.length}
                </span>
              )}
            </Button>
          )}
          className="flex w-64 flex-col gap-1"
        >
          <Listbox
            label="Property"
            value={property}
            onChange={changeFilter(setProperty)}
            options={[{ value: "all", label: "All properties" }, ...properties.map((v) => ({ value: v, label: v }))]}
          />
          <Listbox
            label="Tenant"
            value={recipient}
            onChange={changeFilter(setRecipient)}
            options={[{ value: "all", label: "All tenants" }, ...recipients.map((v) => ({ value: v, label: v }))]}
          />
          <Listbox
            label="Trigger"
            value={trigger}
            onChange={changeFilter(setTrigger)}
            options={[
              { value: "all", label: "All triggers" },
              ...triggers.map((v) => ({ value: v, label: TRIGGER_LABELS[v] ?? v })),
            ]}
          />
        </Popover>
      </div>

      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => {
                  setFirstRender(false);
                  chip.clear();
                }}
                aria-label={`Remove filter: ${chip.label}`}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface pr-1.5 pl-2.5 text-meta font-medium transition-colors duration-(--dur-1) hover:bg-surface-sunk max-md:h-10"
              >
                {chip.label}
                <X aria-hidden className="size-3.5 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={filterKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-6 shadow-1">
              <p className="text-muted-foreground">No messages match these filters.</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setType("all");
                  setProperty("all");
                  setRecipient("all");
                  setTrigger("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <h2 className="sticky top-0 z-10 -mx-1 mb-2 bg-background px-1 py-2 text-meta-style font-semibold">
                    {group.label}
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {group.items.map((message) => {
                      const index = rowIndex++;
                      const stagger = firstRender && !reduceMotion && index < STAGGERED_ROWS;
                      return (
                        <motion.li
                          key={message.id}
                          initial={stagger ? { opacity: 0, y: 4 } : false}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: stagger ? index * 0.03 : 0, ease: [0.25, 1, 0.5, 1] }}
                        >
                          <MessageRow message={message} />
                        </motion.li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
