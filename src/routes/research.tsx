import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ExternalLink, Lightbulb, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResearchResult } from "@/lib/ai-types";
import { researchLink } from "@/lib/ai.functions";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research assistant — Monocle" },
      {
        name: "description",
        content:
          "Paste an article link to get a summary, key takeaways and automatic recommendations for related reading.",
      },
      { property: "og:title", content: "Research assistant — Monocle" },
      {
        property: "og:description",
        content: "Summarise any article by URL and get related reading suggestions automatically.",
      },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);

  const run = useServerFn(researchLink);
  const mutation = useMutation({
    mutationFn: () => run({ data: { url: url.trim() } }),
    onSuccess: setResult,
    onError: (error: Error) => toast.error(error.message || "Could not read that link."),
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader
        eyebrow="Research"
        title="Research assistant"
        description="Drop in a link. You get the gist, the takeaways, and where to read next — without asking."
      />

      <div className="panel mt-10 flex flex-wrap gap-3 p-4">
        <div className="relative min-w-56 flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={url}
            className="pl-9"
            placeholder="https://example.com/article"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) mutation.mutate();
            }}
          />
        </div>
        <Button disabled={!url.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BookOpen className="h-4 w-4" />
          )}
          Analyse
        </Button>
      </div>

      {mutation.isPending && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Reading the article and hunting for related work…
        </p>
      )}

      {result && !mutation.isPending && (
        <div className="mt-8 space-y-6">
          <div className="panel p-6">
            <h2 className="break-words text-xl font-semibold">{result.title}</h2>
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              <span className="truncate">{url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            <p className="mt-4 break-words text-sm leading-relaxed">{result.summary}</p>
            {result.topics.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {result.topics.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {result.takeaways.length > 0 && (
            <div className="panel p-6">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Key takeaways
              </h3>
              <ul className="space-y-2 text-sm">
                {result.takeaways.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground" />
                    <span className="min-w-0 break-words">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div className="panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Read next
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.recommendations.map((r, i) => {
                  const href =
                    r.url && /^https?:\/\//i.test(r.url)
                      ? r.url
                      : `https://www.google.com/search?q=${encodeURIComponent(`${r.title} ${r.where}`)}`;
                  return (
                    <a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-foreground/40"
                    >
                      <p className="flex items-start gap-1.5 break-words text-sm font-medium">
                        <span className="min-w-0 group-hover:underline">{r.title}</span>
                        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      </p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">{r.why}</p>
                      <p className="mt-2 break-words text-xs uppercase tracking-wider text-muted-foreground">
                        {r.where}
                      </p>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
