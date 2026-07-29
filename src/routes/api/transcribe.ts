import { createFileRoute } from "@tanstack/react-router";

const STT_MODEL = "openai/gpt-4o-mini-transcribe";
const MAX_BYTES = 24 * 1024 * 1024;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return new Response("Expected multipart/form-data", { status: 400 });
        }

        const audio = form.get("audio");
        if (!(audio instanceof File) || audio.size === 0) {
          return new Response("No audio uploaded", { status: 400 });
        }
        if (audio.size > MAX_BYTES) {
          return new Response("Recording is too large", { status: 413 });
        }

        const upstream = new FormData();
        upstream.append("model", STT_MODEL);
        upstream.append("file", audio, "recording.wav");

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          console.error(`Transcription failed [${response.status}]: ${body}`);
          return new Response(body || "Transcription failed", { status: response.status });
        }

        const data = (await response.json()) as { text?: string };
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
