/**
 * Request body schemas for the public API routes.
 */
import { z } from "zod";
import { PageStructureSummarySchema } from "./theme.js";

export const GenerateThemeRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  hostname: z.string().min(1).max(256),
  pageSummary: PageStructureSummarySchema,
  userTier: z.enum(["free", "pro"]).default("free"),
});

export type GenerateThemeRequest = z.infer<typeof GenerateThemeRequestSchema>;

export const CheckoutRequestSchema = z.object({
  customerId: z.string().optional(),
  email: z.string().email().optional(),
});

export const PortalRequestSchema = z.object({
  customerId: z.string().min(1),
});
