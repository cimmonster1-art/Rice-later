/**
 * Zod schemas + inferred types for the theme domain (server source of truth).
 */
import { z } from "zod";

export const UrlPathKindSchema = z.enum([
  "home",
  "dashboard",
  "article",
  "docs",
  "shop",
  "auth",
  "checkout",
  "unknown",
]);

export const LayoutDensitySchema = z.enum(["sparse", "normal", "dense"]);

export const PageStructureSummarySchema = z.object({
  hostname: z.string(),
  urlPathKind: UrlPathKindSchema,
  counts: z.object({
    buttons: z.number(),
    links: z.number(),
    inputs: z.number(),
    forms: z.number(),
    tables: z.number(),
    cards: z.number(),
    headings: z.number(),
    images: z.number(),
    navs: z.number(),
    modals: z.number(),
  }),
  hasPasswordFields: z.boolean(),
  hasPaymentFields: z.boolean(),
  hasSensitiveForms: z.boolean(),
  detectedRoles: z.array(z.string()),
  colorPalette: z.array(z.string()),
  typography: z.object({
    likelyFontFamilies: z.array(z.string()),
    averageFontSizePx: z.number().nullable(),
  }),
  layout: z.object({
    bodyWidth: z.number(),
    scrollWidth: z.number(),
    scrollHeight: z.number(),
    density: LayoutDensitySchema,
  }),
});

export const RiskLevelSchema = z.enum(["low", "medium", "high"]);

export const ThemeGenerationResultSchema = z.object({
  themeName: z.string().min(1),
  description: z.string(),
  css: z.string().min(1),
  riskLevel: RiskLevelSchema,
  preservationNotes: z.array(z.string()),
  accessibilityNotes: z.array(z.string()),
  forbiddenChangesAvoided: z.array(z.string()),
});

export type PageStructureSummary = z.infer<typeof PageStructureSummarySchema>;
export type ThemeGenerationResult = z.infer<typeof ThemeGenerationResultSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
