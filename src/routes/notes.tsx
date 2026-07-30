import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock,
  CheckCircle2,
  Gavel,
  ListChecks,
  Loader2,
  Mic,
  Sparkle,
  Square,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MeetingSummary } from "@/lib/ai-types";
import { summarizeNotes } from "@/lib/ai.functions";
import { transcribe, useRecorder } from "@/lib/use-recorder";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting notes summarizer — Monocle" },
      {
        name: "description",
        content:
          "Paste raw meeting notes and get a clean summary with key points, decisions, action items and deadlines.",
      },
      { property: "og:title", content: "Meeting notes summarizer — Monocle" },
      {
        property: "og:description",
        content: "Extract decisions, owners and deadlines from any transcript or note dump.",
      },
    ],
  }),
  component: NotesPage,
});

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ListChecks;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function NotesPage() {
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const { recording, start, stop } = useRecorder();

  const toggleRecording = async () => {
    if (!recording) {
      try {
        await start();
        toast.success("Listening — speak your notes");
      } catch {
        toast.error("Microphone access is needed to record.");
      }
      return;
    }
    const blob = await stop();
    if (!blob) {
      toast.error("That recording was empty — please try again.");
      return;
    }
    setTranscribing(true);
    try {
      const text = await transcribe(blob);
      if (!text.trim()) {
        toast.error("Nothing could be transcribed from that recording.");
        return;
      }
      setNotes((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text).slice(0, 30000));
      toast.success("Speech added to your notes");
    } catch (error) {
      toast.error((error as Error).message || "Could not transcribe that recording.");
    } finally {
      setTranscribing(false);
    }
  };

  const run = useServerFn(summarizeNotes);
  const mutation = useMutation({
    mutationFn: () => run({ data: { notes } }),
    onSuccess: (data) => setSummary(data),
    onError: (error: Error) => toast.error(error.message || "Could not summarize those notes."),
  });

  const empty = (list: unknown[]) => list.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        eyebrow="Distil"
        title="Meeting notes summarizer"
        description="Drop in a transcript or messy notes. Get the summary, the decisions and who owes what by when."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="panel flex flex-col gap-4 p-6">
          <Textarea
            value={notes}
            rows={20}
            maxLength={30000}
            placeholder="Paste meeting notes, a transcript, or a thread…"
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{notes.length} characters</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={recording ? "destructive" : "outline"}
                disabled={transcribing}
                onClick={toggleRecording}
              >
                {transcribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : recording ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {transcribing ? "Transcribing" : recording ? "Stop" : "Speak"}
              </Button>
              <Button
                disabled={notes.trim().length < 20 || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkle className="h-4 w-4" />
                )}
                Summarize
              </Button>
            </div>
          </div>

        </div>

        <div className="space-y-4">
          {!summary && (
            <div className="panel flex min-h-[420px] items-center justify-center p-6">
              <p className="max-w-xs text-center text-sm text-muted-foreground">
                The structured breakdown lands here: summary, key points, decisions, actions and
                deadlines.
              </p>
            </div>
          )}

          {summary && (
            <>
              <Section icon={Sparkle} title="Summary">
                <p className="text-sm leading-relaxed">
                  {summary.summary || "No summary could be extracted."}
                </p>
              </Section>

              <Section icon={ListChecks} title="Key points">
                {empty(summary.keyPoints) ? (
                  <p className="text-sm text-muted-foreground">None found.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {summary.keyPoints.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section icon={Gavel} title="Decisions">
                {empty(summary.decisions) ? (
                  <p className="text-sm text-muted-foreground">No explicit decisions.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {summary.decisions.map((d, i) => (
                      <li key={i} className="rounded-md bg-surface-2 px-3 py-2">
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section icon={CheckCircle2} title="Action items">
                {empty(summary.actionItems) ? (
                  <p className="text-sm text-muted-foreground">No action items.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {summary.actionItems.map((a, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span>{a.task}</span>
                        {a.owner && (
                          <span className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                            {a.owner}
                          </span>
                        )}
                        {a.due && <span className="text-xs text-muted-foreground">due {a.due}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section icon={CalendarClock} title="Deadlines">
                {empty(summary.deadlines) ? (
                  <p className="text-sm text-muted-foreground">No deadlines mentioned.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {summary.deadlines.map((d, i) => (
                      <li key={i} className="flex items-baseline justify-between gap-3">
                        <span>{d.what}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{d.when}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
