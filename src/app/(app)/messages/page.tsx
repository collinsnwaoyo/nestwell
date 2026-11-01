import { getMessages } from "@/lib/db/queries";
import { MessagesList } from "@/components/messages/messages-list";
import { RunRemindersButton } from "@/components/messages/run-reminders-button";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const messages = await getMessages();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Messages</h1>
        <RunRemindersButton />
      </div>

      <div className="mt-6">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <MessagesList messages={messages} />
        )}
      </div>
    </div>
  );
}
