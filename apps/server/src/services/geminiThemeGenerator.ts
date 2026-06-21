/**
 * AI provider abstraction + Google Gemini implementation.
 *
 * SECURITY:
 *  - The Gemini API key is read ONLY from process.env.GEMINI_API_KEY here.
 *  - It is never logged, never returned to clients, never sent to the browser.
 *  - If the key is absent we fall back to the MockThemeGenerator and print a
 *    one-time startup warning.
 */

import { GoogleGenAI } from "@google/genai";
import {
  ThemeGenerationResultSchema,
  type ThemeGenerationResult,
} from "../schemas/theme.js";
import {
  buildThemePrompt,
  buildRepairPrompt,
  type ThemeGenerationInput,
} from "./promptBuilder.js";
import { assertBudgetAvailable, recordUsage } from "./geminiBudget.js";

export type { ThemeGenerationInput };

export interface ThemeAiProvider {
  readonly name: string;
  generateTheme(input: ThemeGenerationInput): Promise<ThemeGenerationResult>;
}

const DEFAULT_MODEL = "gemini-2.5-flash";

/** Strip accidental markdown fences and extract the first JSON object. */
function extractJson(text: string): string {
  let t = text.trim();
  // Remove ```json ... ``` fences if the model added them.
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return t.slice(first, last + 1);
  }
  return t;
}

/**
 * A known-good, fully safe cyberpunk fallback theme. Returned when the model
 * cannot produce valid JSON twice in a row. Also reused by the mock provider.
 */
export const FALLBACK_THEME: ThemeGenerationResult = {
  themeName: "Cyberpunk Neon (Safe Fallback)",
  description:
    "A deep graphite theme with neon cyan accents. Generated locally as a safe fallback.",
  riskLevel: "low",
  preservationNotes: [
    "No elements hidden",
    "Pointer events untouched",
    "Layout preserved",
  ],
  accessibilityNotes: ["High contrast text", "Respects prefers-reduced-motion"],
  forbiddenChangesAvoided: [
    "No display:none on functional elements",
    "No global pointer-events:none",
    "No full-screen overlay",
    "No JavaScript",
  ],
  css: `html.ricelayer-active {
  --rl-cyan: #00f0ff;
}
html.ricelayer-active body {
  background: #0a0c12 !important;
  color: #d6f7ff !important;
  font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif !important;
}
html.ricelayer-active h1, html.ricelayer-active h2, html.ricelayer-active h3 {
  color: #00f0ff !important;
}
html.ricelayer-active a { color: #ff3df0 !important; }
html.ricelayer-active button, html.ricelayer-active [role="button"] {
  background: #10131c !important; color: #00f0ff !important;
  border: 1px solid #00f0ff !important; border-radius: 4px !important;
}
html.ricelayer-active input, html.ricelayer-active textarea, html.ricelayer-active select {
  background: #0d1018 !important; color: #d6f7ff !important;
  border: 1px solid #2a3550 !important; border-radius: 4px !important;
}
@media (prefers-reduced-motion: reduce) {
  html.ricelayer-active * { transition-duration: 0.001ms !important; animation-duration: 0.001ms !important; }
}`,
};

/** Mock provider — works with no API key. Returns a good cyberpunk theme. */
export class MockThemeGenerator implements ThemeAiProvider {
  readonly name = "mock";

  async generateTheme(input: ThemeGenerationInput): Promise<ThemeGenerationResult> {
    // Lightly personalize the description from the prompt, keep CSS safe.
    return {
      ...FALLBACK_THEME,
      themeName: deriveName(input.prompt),
      description: `Mock theme for "${input.prompt}" on ${input.hostname}. Set GEMINI_API_KEY for real AI generation.`,
    };
  }
}

function deriveName(prompt: string): string {
  const cleaned = prompt.replace(/[^a-z0-9 ]/gi, "").trim();
  const words = cleaned.split(/\s+/).slice(0, 4).join(" ");
  return words ? `${words} (Mock)` : "RiceLayer Theme (Mock)";
}

/** Real Gemini provider. */
export class GeminiThemeGenerator implements ThemeAiProvider {
  readonly name = "gemini";
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model = process.env.GEMINI_MODEL || DEFAULT_MODEL) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  private async callModel(promptText: string): Promise<string> {
    // HARD COST GUARD: refuse to spend beyond the Gemini budget cap. When the
    // cap is reached this throws and the orchestrator serves the safe fallback.
    assertBudgetAvailable();

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.55,
      },
    });

    // Track estimated spend from reported token usage.
    const usage = response.usageMetadata;
    recordUsage({
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens:
        usage?.candidatesTokenCount ??
        (usage?.totalTokenCount && usage?.promptTokenCount
          ? usage.totalTokenCount - usage.promptTokenCount
          : 0),
    });

    return response.text ?? "";
  }

  async generateTheme(input: ThemeGenerationInput): Promise<ThemeGenerationResult> {
    const prompt = buildThemePrompt(input);

    // Attempt 1.
    const first = await this.callModel(prompt);
    const parsed1 = tryParse(first);
    if (parsed1.ok) return parsed1.value;

    // Attempt 2: repair prompt.
    const repaired = await this.callModel(buildRepairPrompt(first));
    const parsed2 = tryParse(repaired);
    if (parsed2.ok) return parsed2.value;

    // Both failed — let the orchestrator apply the safe fallback.
    throw new Error("Gemini returned invalid JSON twice");
  }
}

function tryParse(
  text: string
): { ok: true; value: ThemeGenerationResult } | { ok: false; error: string } {
  try {
    const json = JSON.parse(extractJson(text));
    const validated = ThemeGenerationResultSchema.parse(json);
    return { ok: true, value: validated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

let warnedMissingKey = false;

/**
 * Factory: returns the Gemini provider when GEMINI_API_KEY is set, otherwise
 * the mock provider (with a one-time startup warning).
 */
export function createThemeProvider(): ThemeAiProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim()) {
    return new GeminiThemeGenerator(apiKey.trim());
  }
  if (!warnedMissingKey) {
    warnedMissingKey = true;
    console.warn(
      "[RiceLayer] GEMINI_API_KEY is not set — using the MOCK theme provider. " +
        "Set GEMINI_API_KEY in your .env to enable real Gemini generation."
    );
  }
  return new MockThemeGenerator();
}
