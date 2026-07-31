import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

import { getGatewayModel, getStructuredGatewayModel } from "./ai.server";
import {
  planSchema,
  researchSchema,
  summarySchema,
  type GeneratedPlan,
  type MeetingSummary,
  type ResearchResult,
} from "./ai-types";

async function structured<T>(schema: z.ZodType<T>, prompt: string, fallback: T): Promise<T> {
  try {
    const { output } = await generateText({
      model: getStructuredGatewayModel(),
      output: Output.object({ schema }),
      prompt,
    });
    return output as T;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      const text = (error as { text?: string }).text ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return schema.parse(JSON.parse(match[0]));
        } catch {
          return fallback;
        }
      }
      return fallback;
    }
    throw error;
  }
}

/* ---------------- Email generator ---------------- */

export async function runEmailGenerator(input: {
  occasion: string;
  recipient: string;
  tone: string;
  details: string;
  length: string;
}) {
  const { text } = await generateText({
    model: getGatewayModel(),
    system:
      "You are an expert business communication writer. You write clear, professional emails that sound human, never robotic. Always output a subject line on the first line prefixed with 'Subject: ', then a blank line, then the email body. No commentary, no markdown fences.",
    prompt: [
      `Occasion / purpose: ${input.occasion}`,
      input.recipient ? `Recipient: ${input.recipient}` : "",
      `Tone: ${input.tone}`,
      `Length: ${input.length}`,
      input.details ? `Extra context and key points to include: ${input.details}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
  return { email: text.trim() };
}

/* ---------------- Meeting notes summarizer ---------------- */

export async function runSummarizer(notes: string) {
  return structured<MeetingSummary>(
    summarySchema,
    [
      "Summarize the following meeting notes / transcript.",
      "Return a tight narrative summary (max 5 sentences), the key points, explicit decisions made, action items with owner and due date when stated (use null when unknown), and any deadlines mentioned.",
      "Do not invent facts.",
      "---",
      notes,
    ].join("\n"),
    { summary: "", keyPoints: [], decisions: [], actionItems: [], deadlines: [] },
  );
}

/* ---------------- Task planner ---------------- */

export async function runPlanner(input: { goals: string; mode: "daily" | "weekly"; hours: string }) {
  const dayCount = input.mode === "daily" ? 1 : 5;
  return structured<GeneratedPlan>(
    planSchema,
    [
      `Build a realistic ${input.mode} work schedule covering at most ${dayCount} day(s).`,
      input.mode === "daily"
        ? "Use 'Today' as the day name."
        : "Use weekday names Monday through Friday, in order, starting at Monday.",
      `Working hours: ${input.hours}.`,
      "CRITICAL: schedule ONLY the work the user actually described. Never invent filler tasks, generic admin blocks, placeholder focus time or padding to fill the hours.",
      "If the described workload only justifies two blocks, return two blocks. If it only justifies one day, return one day and omit the rest — a short, honest plan is correct; an inflated one is wrong.",
      "Spread the described work sensibly across the available days rather than cramming it into day one, but do not duplicate a task across days unless the user implied it recurs.",
      "Each returned day gets a one-line focus theme derived from that day's actual tasks, and its blocks ordered chronologically with a concrete title and a priority of high, medium or low. Keep every title under 60 characters. Add a break only when a day genuinely has several hours of work.",
      "Goals and workload:",
      input.goals,
    ].join("\n"),
    { days: [] },
  );
}


/* ---------------- Research assistant ---------------- */

async function fetchArticle(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; ResearchAssistant/1.0)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);
  } catch {
    return "";
  }
}

export async function runResearch(url: string) {
  const article = await fetchArticle(url);
  return structured<ResearchResult>(
    researchSchema,
    [
      `Analyse the article at this URL: ${url}`,
      article
        ? `Extracted page text:\n${article}`
        : "The page text could not be fetched. Reason from the URL, its slug and your own knowledge, and say so in the summary.",
      "Return the article title, a summary of about 120 words, the main takeaways, the core topics it covers, and 4 recommendations for further reading on similar topics (each with why it is relevant and where to find it, e.g. publication or site).",
      "For each recommendation also return a 'url': a direct https link to that reading when you are confident it exists, otherwise null. Never invent a URL you are not confident about.",
    ].join("\n\n"),
    { title: url, summary: "", takeaways: [], topics: [], recommendations: [] },
  );
}
