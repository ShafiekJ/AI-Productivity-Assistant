import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { upsertThread, titleFromMessages, type ChatThread } from "@/lib/chat-store";

const STARTERS = [
  "Help me say no to a meeting, politely",
  "What should I focus on first today?",
  "Rewrite this update so it sounds confident",
  "Tell me a joke about deadlines",
];

export function ChatWindow({
  thread,
  onThreadsChange,
}: {
  thread: ChatThread;
  onThreadsChange?: (threads: ChatThread[]) => void;
}) {
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error) => toast.error(error.message || "The assistant could not reply."),
  });

  const focusInput = () => {
    containerRef.current?.querySelector("textarea")?.focus();
  };

  useEffect(() => {
    focusInput();
  }, [thread.id]);

  useEffect(() => {
    if (status === "ready") focusInput();
  }, [status]);

  useEffect(() => {
    if (!messages.length) return;
    const next = upsertThread({
      id: thread.id,
      title: titleFromMessages(messages as UIMessage[], thread.title),
      updatedAt: Date.now(),
      messages: messages as UIMessage[],
    });
    onThreadsChange?.(next);
  }, [messages, status, thread.id, thread.title, onThreadsChange]);

  const busy = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    void sendMessage({ text: value });
  };

  return (
    <div ref={containerRef} className="flex h-full min-h-0 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary font-display text-xl font-bold text-primary-foreground">
                M
              </span>
              <div>
                <h2 className="text-2xl font-semibold">Hey, I&apos;m Mono.</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Your workplace assistant. Ask me for a draft, a plan, a sanity check — or just a
                  bad pun when the day drags.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent
                className={
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-foreground"
                }
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent className="bg-transparent">
                <Shimmer>Thinking...</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl">
          <PromptInput
            onSubmit={(_message, event) => {
              event.preventDefault();
              submit(input);
            }}
          >
            <PromptInputTextarea
              value={input}
              placeholder="Ask Mono anything about your work…"
              onChange={(e) => setInput(e.target.value)}
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={!input.trim() && !busy} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
