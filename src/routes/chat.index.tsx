import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ThreadList } from "@/components/chat/thread-list";
import { loadThreads, newId, upsertThread, type ChatThread } from "@/lib/chat-store";

export const Route = createFileRoute("/chat/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chat with Mono — Monocle" },
      {
        name: "description",
        content:
          "Mono is your warm, occasionally funny workplace assistant. Start a conversation about anything on your plate.",
      },
      { property: "og:title", content: "Chat with Mono — Monocle" },
      {
        property: "og:description",
        content: "A warm workplace assistant for drafts, plans and sanity checks.",
      },
    ],
  }),
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);

  useEffect(() => {
    const existing = loadThreads();
    if (existing.length) {
      void navigate({
        to: "/chat/$threadId",
        params: { threadId: existing[0].id },
        replace: true,
      });
      return;
    }
    const id = newId();
    upsertThread({ id, title: "New conversation", updatedAt: Date.now(), messages: [] });
    void navigate({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
  }, [navigate]);

  return (
    <div className="flex h-[calc(100vh-var(--header-h,0px))] min-h-0">
      <ThreadList threads={threads} onChange={setThreads} />
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Opening your conversation…
      </div>
    </div>
  );
}
