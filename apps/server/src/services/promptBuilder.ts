/**
 * promptBuilder — constructs the strict, privacy-preserving prompt sent to the
 * AI provider. Sends ONLY a minimized structural summary + the user's prompt.
 * Never full HTML, never page text, never input values.
 */

import type { PageStructureSummary } from "../schemas/theme.js";

export const SYSTEM_PROMPT = `You are generating CSS only for a browser extension called RiceLayer. The CSS will be injected into an arbitrary existing website. Your job is to change the site's aesthetic while preserving all functionality. You must not generate JavaScript. You must not hide buttons, forms, inputs, links, navigation, checkout controls, login controls, or legal/safety information. You must not use pointer-events: none globally. You must not use display: none except for purely decorative elements, cookie banners only when the user explicitly asks, or obvious ads only when safe. You must not position a full-screen overlay over the page. You must respect prefers-reduced-motion. Prefer CSS variables, colors, typography, border radius, shadows, outlines, backgrounds, and subtle spacing. Preserve layout. Return strict JSON with themeName, description, css, riskLevel, preservationNotes, accessibilityNotes, forbiddenChangesAvoided.`;

/** Hard formatting rules appended so the model returns parseable JSON only. */
const OUTPUT_CONTRACT = `
OUTPUT FORMAT (STRICT):
Return a single JSON object and NOTHING else. No markdown, no code fences, no prose.
Schema:
{
  "themeName": string,
  "description": string,
  "css": string,            // CSS ONLY. No <style> tags, no <script>, no HTML, no JS, no markdown.
  "riskLevel": "low" | "medium" | "high",
  "preservationNotes": string[],
  "accessibilityNotes": string[],
  "forbiddenChangesAvoided": string[]
}
CSS RULES:
- Scope rules under "html.ricelayer-active" where possible so they only apply when active.
- Use !important sparingly to win the cascade, but NEVER to hide functional UI.
- No @import of remote stylesheets. No remote @font-face url(). Use system font stacks.
- No expression(), no behavior:, no -moz-binding, no javascript: URLs.
- Wrap any animation/transition usage with a prefers-reduced-motion: reduce guard.`;

/** Build the per-request user prompt from the structural summary. */
export function buildThemePrompt(input: ThemeGenerationInput): string {
  const s = input.pageSummary;
  const safety = [
    s.hasPasswordFields ? "hasPasswordFields" : null,
    s.hasPaymentFields ? "hasPaymentFields" : null,
    s.hasSensitiveForms ? "hasSensitiveForms" : null,
  ].filter(Boolean);

  return `${SYSTEM_PROMPT}

USER REQUEST: "${input.prompt}"

PAGE CONTEXT (structural summary only — no page content was sent):
- hostname: ${input.hostname}
- pageCategory: ${s.urlPathKind}
- elementCounts: ${JSON.stringify(s.counts)}
- detectedRoles: ${s.detectedRoles.join(", ") || "none"}
- colorPalette: ${s.colorPalette.join(", ") || "unknown"}
- typography: fonts=[${s.typography.likelyFontFamilies.join(", ")}], avgSizePx=${
    s.typography.averageFontSizePx ?? "unknown"
  }
- layoutDensity: ${s.layout.density} (bodyWidth=${s.layout.bodyWidth})
- safetyFlags: ${safety.length ? safety.join(", ") : "none"}

${
  safety.length
    ? "IMPORTANT: This page contains sensitive forms. Be conservative: do not restyle in a way that could obscure or mislead password/payment fields. Keep them clearly visible and labeled."
    : ""
}
${OUTPUT_CONTRACT}`;
}

/** Repair prompt used when the first response failed to parse as JSON. */
export function buildRepairPrompt(badOutput: string): string {
  return `Your previous response was not valid JSON. Return ONLY the JSON object described, with no markdown fences or commentary. Fix and re-emit it now. Previous (truncated): ${badOutput.slice(
    0,
    1500
  )}
${OUTPUT_CONTRACT}`;
}

export interface ThemeGenerationInput {
  prompt: string;
  hostname: string;
  pageSummary: PageStructureSummary;
  userTier: "free" | "pro";
}
