import { z } from 'zod';

export const CopilotResponseSchema = z.object({
  answer: z.string().describe('Natural language explanation or conversational response.'),
  facts: z.array(z.string()).describe('List of verified facts extracted explicitly from the deterministic CareerAI context provided. Do not hallucinate.'),
  recommendations: z.array(z.string()).describe('Actionable recommendations or advice derived from the facts.'),
  unknowns: z.array(z.string()).describe('List of missing or unknown information that the user asked about but is not present in context.'),
  suggestedActions: z.array(z.string()).describe('List of short UI actionable follow-ups (e.g. "Update Resume", "Take Technical Assessment").')
});

export type CopilotStructuredOutput = z.infer<typeof CopilotResponseSchema>;
