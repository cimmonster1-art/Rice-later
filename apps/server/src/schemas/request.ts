/**
 * Request body schemas for the public API routes.
 */
import { z } from "zod";
import { PageStructureSummarySchema } from "./theme.js";

export const GenerateThemeRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  hostname: z.string().min(1).max(256),
  pageSummary: PageStructureSummarySchema,
});

export type GenerateThemeRequest = z.infer<typeof GenerateThemeRequestSchema>;
