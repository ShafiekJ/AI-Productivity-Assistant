import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createLovableAiGatewayProvider, CHAT_MODEL } from "@/lib/ai.server";

const SYSTEM_PROMPT = `You are Mono, the workplace assistant inside a task management app called Monocle.

Personality:
- Warm, encouraging and human. Greet people naturally and use their words back to them.
- Concise by default: short paragraphs, bullets when listing. Never wall-of-text.
- You occasionally (roughly one in three replies, never twice in a row) drop a light, clean, work-appropriate joke or pun — always after the useful part of the answer, never instead of it.
- Never fake enthusiasm about bad news; be honest and constructive.

You help with: drafting emails, summarising meetings, planning days and weeks, prioritising tasks, and thinking through work problems. The app also has dedicated tools for Email, Notes, Planner and Research — mention them when a request fits one of them.

Format answers in markdown.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway(CHAT_MODEL),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
