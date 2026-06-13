import { describe, it, expect, afterEach } from "vitest";
import { generateTheme, __setProviderForTests } from "./aiThemeGenerator.js";
import {
  MockThemeGenerator,
  FALLBACK_THEME,
  type ThemeAiProvider,
} from "./geminiThemeGenerator.js";
import type { PageStructureSummary } from "../schemas/theme.js";

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

const input = {
  prompt: "make it cyberpunk",
  hostname: "example.com",
  pageSummary: summary,
};

afterEach(() => __setProviderForTests(null));

describe("aiThemeGenerator", () => {
  it("works with the mock provider when no key exists", async () => {
    __setProviderForTests(new MockThemeGenerator());
    const out = await generateTheme(input);
    expect(out.provider).toBe("mock");
    expect(out.result.css).toMatch(/ricelayer-active/);
    expect(out.result.css.length).toBeGreaterThan(50);
  });

  it("falls back safely when the provider throws (invalid JSON twice)", async () => {
    const broken: ThemeAiProvider = {
      name: "broken",
      async generateTheme() {
        throw new Error("Gemini returned invalid JSON twice");
      },
    };
    __setProviderForTests(broken);
    const out = await generateTheme(input);
    expect(out.usedFallback).toBe(true);
    expect(out.result.themeName).toBe(FALLBACK_THEME.themeName);
    expect(out.result.css).toMatch(/background/);
  });

  it("sanitizes unsafe CSS returned by the provider", async () => {
    const unsafe: ThemeAiProvider = {
      name: "unsafe",
      async generateTheme() {
        return {
          themeName: "Evil",
          description: "bad",
          css: "body { pointer-events: none; } a { color: cyan; } .x { behavior: url(e.htc); }",
          riskLevel: "high",
          preservationNotes: [],
          accessibilityNotes: [],
          forbiddenChangesAvoided: [],
        };
      },
    };
    __setProviderForTests(unsafe);
    const out = await generateTheme(input);
    expect(out.result.css).not.toMatch(/pointer-events/i);
    expect(out.result.css).not.toMatch(/behavior:/i);
    expect(out.sanitizedRemovals.length).toBeGreaterThan(0);
    // Safe rule survives.
    expect(out.result.css).toMatch(/color:\s*cyan/);
  });

  it("returns a usable fallback when sanitizing strips everything", async () => {
    const allBad: ThemeAiProvider = {
      name: "allbad",
      async generateTheme() {
        return {
          themeName: "AllBad",
          description: "bad",
          css: "body { pointer-events: none; }",
          riskLevel: "high",
          preservationNotes: [],
          accessibilityNotes: [],
          forbiddenChangesAvoided: [],
        };
      },
    };
    __setProviderForTests(allBad);
    const out = await generateTheme(input);
    expect(out.usedFallback).toBe(true);
    expect(out.result.css.trim().length).toBeGreaterThan(20);
  });
});
