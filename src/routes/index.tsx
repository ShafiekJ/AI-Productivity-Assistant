import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarRange, FileText, Mail, MessageSquare, Telescope } from "lucide-react";

import { PageHeader } from "@/components/page-header";

const tools = [
  {
    title: "Email generator",
    url: "/email",
    icon: Mail,
    blurb: "Professional emails for any occasion, in the tone you pick.",
  },
  {
    title: "Notes summarizer",
    url: "/notes",
    icon: FileText,
    blurb: "Turn raw meeting notes into decisions, actions and deadlines.",
  },
  {
    title: "Task planner",
    url: "/planner",
    icon: CalendarRange,
    blurb: "Daily and weekly schedules you can fill with one click.",
  },
  {
    title: "Research assistant",
    url: "/research",
    icon: Telescope,
    blurb: "Summarise any article link and get related reading unprompted.",
  },
  {
    title: "Assistant chat",
    url: "/chat",
    icon: MessageSquare,
    blurb: "A warm workplace companion for everything in between.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monocle — AI workspace for tasks, email and notes" },
      {
        name: "description",
        content:
          "Monocle is a sleek monochrome workspace: AI email drafting, meeting summaries, daily planning, research digests and a warm assistant chat.",
      },
      { property: "og:title", content: "Monocle — AI workspace for tasks, email and notes" },
      {
        property: "og:description",
        content:
          "AI email drafting, meeting summaries, daily and weekly planning, research digests and a warm workplace assistant.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="grain min-h-full">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <PageHeader
          eyebrow="Monocle"
          title="Everything your workday needs, in black and white."
          description="Five focused tools and one warm assistant. No clutter, no colour noise — just get the work out."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.url}
              to={tool.url}
              className="panel group flex flex-col gap-3 p-6 transition-colors hover:border-foreground/40 hover:bg-surface"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
                  <tool.icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <h2 className="text-lg font-semibold">{tool.title}</h2>
              <p className="text-sm text-muted-foreground">{tool.blurb}</p>
            </Link>
          ))}
        </div>

        <section
          aria-labelledby="responsible-ai"
          className="panel mt-10 p-6 text-sm text-muted-foreground"
        >
          <h2 id="responsible-ai" className="text-sm font-semibold text-foreground">
            Responsible AI
          </h2>
          <p className="mt-2 max-w-3xl">
            Monocle&apos;s tools are powered by AI models that can be wrong, incomplete or out of
            date. Treat every draft, summary, schedule and research digest as a starting point —
            review and edit before sending or acting on it, especially for anything legal,
            financial, medical or people-related.
          </p>
          <ul className="mt-3 max-w-3xl list-disc space-y-1 pl-5">
            <li>
              Don&apos;t paste confidential, personal or regulated data you wouldn&apos;t share with
              a third-party AI provider.
            </li>
            <li>Voice notes and text you submit are sent to an AI provider for processing.</li>
            <li>
              AI output is not professional advice, and a human stays accountable for the final
              decision.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
