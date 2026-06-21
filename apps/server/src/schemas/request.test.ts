import { describe, it, expect } from "vitest";
import { GenerateThemeRequestSchema, MAX_PROMPT_LENGTH } from "./request.js";
import type { PageStructureSummary } from "./theme.js";

const summary: PageStructureSummary = {
  hostname: "example.com",
  urlPathKind: "home",
  counts: { buttons: 1, links: 1, inputs: 0, forms: 0, tables: 0, cards: 0, headings: 1, images: 0, navs: 0, modals: 0 },
  hasPasswordFields: false,
  hasPaymentFields: false,
  hasSensitiveForms: false,
  detectedRoles: [],
  colorPalette: [],
  typography: { likelyFontFamilies: [], averageFontSizePx: null },
  layout: { bodyWidth: 800, scrollWidth: 800, scrollHeight: 1000, density: "normal" },
};

const base = { hostname: "example.com", pageSummary: summary };

describe("GenerateThemeRequestSchema (50-char prompt hard limit)", () => {
  it("exposes a 50-character limit", () => {
    expect(MAX_PROMPT_LENGTH).toBe(50);
  });

  it("accepts a prompt of exactly 50 characters", () => {
    const prompt = "a".repeat(50);
    expect(GenerateThemeRequestSchema.safeParse({ ...base, prompt }).success).toBe(true);
  });

  it("rejects a prompt longer than 50 characters", () => {
    const prompt = "a".repeat(51);
    expect(GenerateThemeRequestSchema.safeParse({ ...base, prompt }).success).toBe(false);
  });

  it("rejects an empty prompt", () => {
    expect(GenerateThemeRequestSchema.safeParse({ ...base, prompt: "" }).success).toBe(false);
  });

  it("accepts a normal short prompt", () => {
    expect(
      GenerateThemeRequestSchema.safeParse({ ...base, prompt: "green hacker terminal" }).success
    ).toBe(true);
  });
});
