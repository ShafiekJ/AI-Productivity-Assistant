import { z } from "zod";

export const summarySchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({ task: z.string(), owner: z.string().nullable(), due: z.string().nullable() }),
  ),
  deadlines: z.array(z.object({ what: z.string(), when: z.string() })),
});
export type MeetingSummary = z.infer<typeof summarySchema>;

export const planSchema = z.object({
  days: z.array(
    z.object({
      day: z.string(),
      focus: z.string(),
      blocks: z.array(
        z.object({
          time: z.string(),
          title: z.string(),
          priority: z.enum(["high", "medium", "low"]),
        }),
      ),
    }),
  ),
});
export type GeneratedPlan = z.infer<typeof planSchema>;

export const researchSchema = z.object({
  title: z.string(),
  summary: z.string(),
  takeaways: z.array(z.string()),
  topics: z.array(z.string()),
  recommendations: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      where: z.string(),
      url: z.string().nullable(),
    }),
  ),
});
export type ResearchResult = z.infer<typeof researchSchema>;
