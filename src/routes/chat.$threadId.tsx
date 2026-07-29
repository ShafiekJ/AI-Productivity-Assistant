import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ChatWindow } from "@/components/chat/chat-window";
import { ThreadList } from "@/components/chat/thread-list";
import { loadThreads, upsertThread, type ChatThread } from "@/lib/chat-store";

export const Route = createFileRoute("/chat/$threadId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chat with Mono — Monocle" },
      {
        name: "description",
        content:
          "Your saved conversation with Mono, the warm workplace assistant that drafts, plans and jokes.",
      },
      { property: "og:title", content: "Chat with Mono — Monocle" },
      {
        property: "og:description",
        content: "A warm workplace assistant for drafts, plans and sanity checks.",
      },
    ],
  }),
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [thread, setThread] = useState<ChatThread | null>(null);

  useEffect(() => {
    const existing = loadThreads();
    const found = existing.find((t) => t.id === threadId);
    if (found) {
      setThreads(existing);
      setThread(found);
      return;
    }
    const created: ChatThread = {
      id: threadId,
      title: "New conversation",
      updatedAt: Date.now(),
      messages: [],
    };
    setThreads(upsertThread(created));
    setThread(created);
  }, [threadId]);

  return (
    <div className="flex h-screen min-h-0">
      <ThreadList threads={threads} activeId={threadId} onChange={setThreads} />
      <div className="min-w-0 flex-1">
        {thread && (
          <ChatWindow key={thread.id} thread={thread} onThreadsChange={setThreads} />
        )}
      </div>
    </div>
  );
}
