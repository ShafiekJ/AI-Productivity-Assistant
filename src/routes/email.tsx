import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
import { generateEmail } from "@/lib/ai.functions";

const TONES = [
  "Professional",
  "Friendly",
  "Formal",
  "Warm",
  "Direct",
  "Apologetic",
  "Persuasive",
  "Enthusiastic",
  "Diplomatic",
];
const LENGTHS = ["Short (3-4 sentences)", "Medium (1-2 paragraphs)", "Detailed (3+ paragraphs)"];

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email generator — Monocle" },
      {
        name: "description",
        content:
          "Generate professional emails for any occasion and switch tone from formal to friendly in one click.",
      },
      { property: "og:title", content: "Email generator — Monocle" },
      {
        property: "og:description",
        content: "Professional AI email drafting with adjustable tone, length and context.",
      },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const [occasion, setOccasion] = useState("");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [length, setLength] = useState(LENGTHS[1]);
  const [details, setDetails] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const run = useServerFn(generateEmail);
  const mutation = useMutation({
    mutationFn: () => run({ data: { occasion, recipient, tone, length, details } }),
    onSuccess: (data) => setResult(data.email),
    onError: (error: Error) => toast.error(error.message || "Could not generate the email."),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Email copied");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        eyebrow="Compose"
        title="Email generator"
        description="Tell it the occasion, pick a tone, and get a send-ready draft."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="panel space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="occasion">Occasion</Label>
            <Input
              id="occasion"
              value={occasion}
              maxLength={300}
              placeholder="Asking for a deadline extension"
              onChange={(e) => setOccasion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient (optional)</Label>
            <Input
              id="recipient"
              value={recipient}
              maxLength={150}
              placeholder="Priya, my manager"
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTHS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Context & key points (optional)</Label>
            <Textarea
              id="details"
              value={details}
              maxLength={4000}
              rows={6}
              placeholder="Project ships Friday, blocked on design review, need until Tuesday…"
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={!occasion.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Generate email
          </Button>
        </div>

        <div className="panel flex min-h-[420px] flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Draft
            </h2>
            {result && (
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
            )}
          </div>
          {result ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{result}</pre>
          ) : (
            <p className="m-auto max-w-xs text-center text-sm text-muted-foreground">
              Your draft appears here. Change the tone and regenerate to compare versions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
