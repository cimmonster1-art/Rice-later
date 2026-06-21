/**
 * Request body schemas for the public API routes.
 */
import { z } from "zod";
import { PageStructureSummarySchema } from "./theme.js";

/**
 * Hard limit on the AI prompt length. Users describe the interface they want in
 * a short phrase via the popup chat box; this must match MAX_PROMPT_LENGTH in
 * the extension (apps/extension/src/shared/constants.ts).
 */
export const MAX_PROMPT_LENGTH = 50;

export const GenerateThemeRequestSchema = z.object({
  prompt: z.string().min(1).max(MAX_PROMPT_LENGTH),
  hostname: z.string().min(1).max(256),
  pageSummary: PageStructureSummarySchema,
});

export type GenerateThemeRequest = z.infer<typeof GenerateThemeRequestSchema>;
