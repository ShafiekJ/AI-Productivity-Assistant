export type Priority = "high" | "medium" | "low";

export type Task = {
  id: string;
  day: string;
  time: string;
  title: string;
  priority: Priority;
  done: boolean;
  order: number;
};

const KEY = "monocle.tasks.v1";

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Task[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    /* ignore */
  }
}

export const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
