import { Link, useNavigate } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteThread, newId, upsertThread, type ChatThread } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

export function ThreadList({
  threads,
  activeId,
  onChange,
}: {
  threads: ChatThread[];
  activeId?: string;
  onChange: (threads: ChatThread[]) => void;
}) {
  const navigate = useNavigate();

  const createThread = () => {
    const id = newId();
    onChange(upsertThread({ id, title: "New conversation", updatedAt: Date.now(), messages: [] }));
    void navigate({ to: "/chat/$threadId", params: { threadId: id } });
  };

  const remove = (id: string) => {
    const next = deleteThread(id);
    onChange(next);
    if (id === activeId) {
      if (next.length) void navigate({ to: "/chat/$threadId", params: { threadId: next[0].id } });
      else createThread();
    }
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="p-3">
        <Button className="w-full" onClick={createThread}>
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {threads.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations yet</p>
        )}
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={cn(
              "group flex items-center gap-1 rounded-lg px-2 transition-colors",
              thread.id === activeId ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
            )}
          >
            <Link
              to="/chat/$threadId"
              params={{ threadId: thread.id }}
              className="min-w-0 flex-1 truncate py-2 text-sm"
            >
              {thread.title}
            </Link>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Delete ${thread.title}`}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => remove(thread.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </nav>
    </aside>
  );
}
