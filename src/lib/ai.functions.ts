import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  runEmailGenerator,
  runPlanner,
  runResearch,
  runSummarizer,
} from "@/lib/ai-tasks.server";

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        occasion: z.string().trim().min(1).max(300),
        recipient: z.string().trim().max(150).default(""),
        tone: z.string().trim().min(1).max(40),
        details: z.string().trim().max(4000).default(""),
        length: z.string().trim().min(1).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data }) => runEmailGenerator(data));

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ notes: z.string().trim().min(20).max(30000) }).parse(input),
  )
  .handler(async ({ data }) => runSummarizer(data.notes));

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        goals: z.string().trim().min(3).max(4000),
        mode: z.enum(["daily", "weekly"]),
        hours: z.string().trim().min(1).max(60),
      })
      .parse(input),
  )
  .handler(async ({ data }) => runPlanner(data));

export const researchLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ url: z.string().trim().url().max(2000) }).parse(input),
  )
  .handler(async ({ data }) => runResearch(data.url));
