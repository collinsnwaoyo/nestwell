import { getMessages } from "@/lib/db/queries";
import { MessagesList } from "@/components/messages/messages-list";
import { RunRemindersButton } from "@/components/messages/run-reminders-button";
import { Page, PageHeader } from "@/components/shell/page";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const messages = await getMessages();

  return (
    <Page>
      <PageHeader title="Messages" actions={<RunRemindersButton />} />
      {messages.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-6 shadow-1">
          <p className="text-muted-foreground">No messages yet. Run today&apos;s reminders to prepare any that are due.</p>
          <RunRemindersButton />
        </div>
      ) : (
        <MessagesList messages={messages} />
      )}
    </Page>
  );
}
