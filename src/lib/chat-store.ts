import type { UIMessage } from "ai";

export type ChatThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

const KEY = "monocle.chat.threads.v1";

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatThread[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {
    /* storage full or unavailable */
  }
}

export function getThread(id: string): ChatThread | undefined {
  return loadThreads().find((t) => t.id === id);
}

export function upsertThread(thread: ChatThread) {
  const threads = loadThreads();
  const index = threads.findIndex((t) => t.id === thread.id);
  if (index === -1) threads.unshift(thread);
  else threads[index] = thread;
  threads.sort((a, b) => b.updatedAt - a.updatedAt);
  saveThreads(threads);
  return threads;
}

export function deleteThread(id: string) {
  const threads = loadThreads().filter((t) => t.id !== id);
  saveThreads(threads);
  return threads;
}

export function titleFromMessages(messages: UIMessage[], fallback = "New conversation") {
  const first = messages.find((m) => m.role === "user");
  if (!first) return fallback;
  const text = first.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
  if (!text) return fallback;
  return text.length > 44 ? `${text.slice(0, 44)}…` : text;
}
