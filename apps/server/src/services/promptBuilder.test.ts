import { describe, it, expect } from "vitest";
import { buildThemePrompt, SYSTEM_PROMPT } from "./promptBuilder.js";
import type { PageStructureSummary } from "../schemas/theme.js";

const summary: PageStructureSummary = {
  hostname: "example.com",
  urlPathKind: "home",
  counts: {
    buttons: 5,
    links: 20,
    inputs: 3,
    forms: 1,
    tables: 0,
    cards: 4,
    headings: 6,
    images: 8,
    navs: 1,
    modals: 0,
  },
  hasPasswordFields: false,
  hasPaymentFields: false,
  hasSensitiveForms: false,
  detectedRoles: ["navigation", "main"],
  colorPalette: ["rgb(255,255,255)", "rgb(0,0,0)"],
  typography: { likelyFontFamilies: ["Arial"], averageFontSizePx: 16 },
  layout: { bodyWidth: 1200, scrollWidth: 1200, scrollHeight: 3000, density: "normal" },
};

describe("promptBuilder", () => {
  it("system prompt forbids JS and hiding functional UI", () => {
    expect(SYSTEM_PROMPT).toMatch(/must not generate JavaScript/i);
    expect(SYSTEM_PROMPT).toMatch(/CSS only/i);
    expect(SYSTEM_PROMPT).toMatch(/pointer-events: none/i);
  });

  it("includes CSS-only contract and forbidden-changes guidance", () => {
    const p = buildThemePrompt({
      prompt: "make it cyberpunk",
      hostname: "example.com",
      pageSummary: summary,
    });
    expect(p).toMatch(/CSS ONLY/i);
    expect(p).toMatch(/No <script>/i);
    expect(p).toMatch(/prefers-reduced-motion/i);
    expect(p).toMatch(/make it cyberpunk/);
    expect(p).toMatch(/example\.com/);
  });

  it("does not leak full HTML — only structural summary fields", () => {
    const p = buildThemePrompt({
      prompt: "x",
      hostname: "example.com",
      pageSummary: summary,
    });
    expect(p).toMatch(/elementCounts/);
    expect(p).not.toMatch(/<html/i);
    expect(p).not.toMatch(/innerText/i);
  });

  it("adds extra caution when sensitive forms are present", () => {
    const p = buildThemePrompt({
      prompt: "x",
      hostname: "bank.com",
      pageSummary: { ...summary, hasPasswordFields: true, hasSensitiveForms: true },
    });
    expect(p).toMatch(/sensitive forms/i);
    expect(p).toMatch(/hasPasswordFields/);
  });
});
