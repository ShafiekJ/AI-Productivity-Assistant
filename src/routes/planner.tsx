import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, GripVertical, Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GeneratedPlan } from "@/lib/ai-types";
import { generatePlan } from "@/lib/ai.functions";
import { loadTasks, newId, priorityRank, saveTasks, type Priority, type Task } from "@/lib/task-store";
import { cn } from "@/lib/utils";

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Task planner — Monocle" },
      {
        name: "description",
        content:
          "Generate daily and weekly schedules, fill them into your day with one click, and reorder priorities per day.",
      },
      { property: "og:title", content: "Task planner — Monocle" },
      {
        property: "og:description",
        content: "AI-built daily and weekly schedules with an adjustable priority list per day.",
      },
    ],
  }),
  component: PlannerPage,
});

const priorityStyles: Record<Priority, string> = {
  high: "border-priority-high text-priority-high",
  medium: "border-priority-medium text-priority-medium",
  low: "border-priority-low text-priority-low",
};

function PlannerPage() {
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [hours, setHours] = useState("09:00 – 17:30");
  const [goals, setGoals] = useState("");
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftDay, setDraftDay] = useState("Today");
  const [dragId, setDragId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    setTasks(loadTasks());
    setHydrated(true);
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const update = (next: Task[]) => {
    setTasks(next);
    saveTasks(next);
  };

  const renumber = (list: Task[]) => {
    const counters = new Map<string, number>();
    return list.map((t) => {
      const n = counters.get(t.day) ?? 0;
      counters.set(t.day, n + 1);
      return { ...t, order: n };
    });
  };

  /** Move the dragged task to sit before/after the hovered task, in any day. */
  const moveOver = (targetId: string, after: boolean) => {
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId) return;
    const current = tasksRef.current;
    const source = current.find((t) => t.id === sourceId);
    const target = current.find((t) => t.id === targetId);
    if (!source || !target) return;

    const rest = current.filter((t) => t.id !== sourceId);
    const targetIndex = rest.findIndex((t) => t.id === targetId);
    if (targetIndex === -1) return;
    const insertAt = after ? targetIndex + 1 : targetIndex;
    const moved: Task = { ...source, day: target.day };
    const nextOrdered = [...rest.slice(0, insertAt), moved, ...rest.slice(insertAt)];
    const next = renumber(nextOrdered);
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    tasksRef.current = next;
    update(next);
  };

  /** Drop into empty space at the end of a day column. */
  const moveToDayEnd = (dayName: string) => {
    const sourceId = dragIdRef.current;
    if (!sourceId) return;
    const current = tasksRef.current;
    const source = current.find((t) => t.id === sourceId);
    if (!source) return;
    const rest = current.filter((t) => t.id !== sourceId);
    const lastIndex = rest.map((t) => t.day).lastIndexOf(dayName);
    const insertAt = lastIndex === -1 ? rest.length : lastIndex + 1;
    if (source.day === dayName && lastIndex !== -1 && rest[lastIndex]?.order === source.order - 1)
      return;
    const nextOrdered = [
      ...rest.slice(0, insertAt),
      { ...source, day: dayName },
      ...rest.slice(insertAt),
    ];
    const next = renumber(nextOrdered);
    tasksRef.current = next;
    update(next);
  };

  const endDrag = () => {
    dragIdRef.current = null;
    setDragId(null);
  };


  const doneKeys = useMemo(
    () => new Set(tasks.filter((t) => t.done).map((t) => `${t.day}::${t.title}`)),
    [tasks],
  );

  const run = useServerFn(generatePlan);
  const mutation = useMutation({
    mutationFn: () => run({ data: { goals, mode, hours } }),
    onSuccess: (data) => {
      setPlan(data);
      if (!data.days.length) toast.error("The planner returned nothing — try adding more detail.");
    },
    onError: (error: Error) => toast.error(error.message || "Could not build that schedule."),
  });

  const addBlock = (day: string, time: string, title: string, priority: Priority) => {
    const next = [
      ...tasks,
      { id: newId(), day, time, title, priority, done: false, order: tasks.length },
    ];
    update(next);
    toast.success(`Added to ${day}`);
  };

  const addWholeDay = (day: GeneratedPlan["days"][number]) => {
    const next = [
      ...tasks,
      ...day.blocks.map((b, i) => ({
        id: newId(),
        day: day.day,
        time: b.time,
        title: b.title,
        priority: b.priority,
        done: false,
        order: tasks.length + i,
      })),
    ];
    update(next);
    toast.success(`${day.blocks.length} blocks added to ${day.day}`);
  };

  const dayList = plan?.days ?? [];

  const days = useMemo(() => {
    const names = Array.from(new Set(tasks.map((t) => t.day)));
    names.sort((a, b) => {
      const ia = WEEK.indexOf(a);
      const ib = WEEK.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return -1;
      if (ib === -1) return 1;
      return ia - ib;
    });
    return names.map((name) => ({
      name,
      items: tasks
        .filter((t) => t.day === name)
        .sort((a, b) => a.order - b.order || priorityRank[a.priority] - priorityRank[b.priority]),
    }));
  }, [tasks]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        eyebrow="Plan"
        title="Task planner"
        description="Generate a day or a week, fill it in with a click, then tune the priority of everything on your list."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <div className="panel space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as "daily" | "weekly")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly (Mon–Fri)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Working hours</Label>
                <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">What needs to happen?</Label>
              <Textarea
                id="goals"
                rows={7}
                value={goals}
                maxLength={4000}
                placeholder="Ship the pricing page, prep Thursday board deck, 1:1s, clear inbox backlog…"
                onChange={(e) => setGoals(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={goals.trim().length < 3 || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Generate {mode} schedule
            </Button>
          </div>

          {dayList.map((day) => (
            <div key={day.day} className="panel p-6">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{day.day}</h3>
                <Button variant="outline" size="sm" onClick={() => addWholeDay(day)}>
                  <CalendarPlus className="h-4 w-4" />
                  Fill day
                </Button>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{day.focus}</p>
              <ul className="space-y-2">
                {day.blocks.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                      {b.time}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        doneKeys.has(`${day.day}::${b.title}`) &&
                          "text-muted-foreground line-through",
                      )}
                    >
                      {b.title}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                        priorityStyles[b.priority],
                      )}
                    >
                      {b.priority}
                    </span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Add ${b.title}`}
                      onClick={() => addBlock(day.day, b.time, b.title, b.priority)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="panel space-y-6 p-6">
          <div>
            <h2 className="text-lg font-semibold">Your priority list</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saved in this browser. Highest priority floats to the top of each day.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Input
              value={draft}
              placeholder="Add a task…"
              className="min-w-40 flex-1"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) {
                  addBlock(draftDay, "", draft.trim(), "medium");
                  setDraft("");
                }
              }}
            />
            <Select value={draftDay} onValueChange={setDraftDay}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Today", ...WEEK].map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!draft.trim()}
              onClick={() => {
                addBlock(draftDay, "", draft.trim(), "medium");
                setDraft("");
              }}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {hydrated && days.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Nothing scheduled yet. Generate a plan and hit “Fill day”.
            </p>
          )}

          {days.map((day) => (
            <div key={day.name} className="space-y-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                <h3 className="truncate text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {day.name}
                </h3>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {day.items.filter((t) => t.done).length}/{day.items.length} done
                </span>
              </div>
              <ul
                className="min-h-12 space-y-2 rounded-lg transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  moveToDayEnd(day.name);
                  endDrag();
                }}
              >
                {day.items.map((task) => (
                  <li
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      dragIdRef.current = task.id;
                      setDragId(task.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      const box = e.currentTarget.getBoundingClientRect();
                      moveOver(task.id, e.clientY > box.top + box.height / 2);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      endDrag();
                    }}
                    onDragEnd={endDrag}
                    className={cn(
                      "flex cursor-grab items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2",
                      "transition-[opacity,box-shadow,transform,border-color] duration-200 ease-out active:cursor-grabbing",
                      dragId === task.id
                        ? "scale-[0.99] border-foreground/40 opacity-60 shadow-lg"
                        : "hover:border-foreground/25",
                    )}
                  >
                    <GripVertical className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="mt-1.5 shrink-0">
                      <Checkbox
                        checked={task.done}
                        aria-label="Toggle done"
                        onCheckedChange={(v) =>
                          update(
                            tasks.map((t) => (t.id === task.id ? { ...t, done: v === true } : t)),
                          )
                        }
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
                      {task.time && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {task.time}
                        </span>
                      )}
                      <span
                        className={cn(
                          "break-words text-sm leading-snug",
                          task.done && "text-muted-foreground line-through",
                        )}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Select
                        value={task.priority}
                        onValueChange={(v) =>
                          update(
                            tasks.map((t) =>
                              t.id === task.id ? { ...t, priority: v as Priority } : t,
                            ),
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-[100px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Delete task"
                        onClick={() => update(tasks.filter((t) => t.id !== task.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
