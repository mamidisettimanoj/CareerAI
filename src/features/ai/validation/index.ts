import { z } from 'zod';

export const ResumeFeedbackSchema = z.object({
  score: z.number().describe('A score from 0-100 indicating resume quality.'),
  strengths: z.array(z.string()).describe('List of strong points found in the resume.'),
  weaknesses: z.array(z.string()).describe('List of critical weaknesses or missing information.'),
  recommendations: z.array(z.string()).describe('Actionable steps to improve the resume.'),
  isHallucinated: z.boolean().default(false).describe('Internal flag to ensure AI acknowledges constraints. Set to false.')
});

export type ResumeFeedbackOutput = z.infer<typeof ResumeFeedbackSchema>;
