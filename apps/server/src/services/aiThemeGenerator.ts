/**
 * aiThemeGenerator — orchestration facade used by the route.
 *
 * Flow: provider.generateTheme -> validate -> sanitize CSS -> return.
 * On any failure it returns the safe fallback preset theme so the endpoint
 * never breaks the extension.
 */

import {
  createThemeProvider,
  FALLBACK_THEME,
  type ThemeAiProvider,
  type ThemeGenerationInput,
} from "./geminiThemeGenerator.js";
import { ThemeGenerationResultSchema, type ThemeGenerationResult } from "../schemas/theme.js";
import { sanitizeCss } from "./cssSanitizer.js";

export interface GenerateOutcome {
  result: ThemeGenerationResult;
  provider: string;
  usedFallback: boolean;
  sanitizedRemovals: string[];
}

// Reuse a single provider instance per process.
let provider: ThemeAiProvider | null = null;
function getProvider(): ThemeAiProvider {
  if (!provider) provider = createThemeProvider();
  return provider;
}

/** Test seam: inject a provider (e.g. a stub). */
export function __setProviderForTests(p: ThemeAiProvider | null): void {
  provider = p;
}

export async function generateTheme(
  input: ThemeGenerationInput
): Promise<GenerateOutcome> {
  const p = getProvider();
  let result: ThemeGenerationResult;
  let usedFallback = false;

  try {
    const raw = await p.generateTheme(input);
    // Re-validate (providers validate too; belt and suspenders).
    result = ThemeGenerationResultSchema.parse(raw);
  } catch (err) {
    console.warn(
      `[RiceLayer] theme generation failed (${
        err instanceof Error ? err.message : String(err)
      }); returning safe fallback.`
    );
    result = { ...FALLBACK_THEME };
    usedFallback = true;
  }

  // Always sanitize before returning to the client.
  const { css, removed } = sanitizeCss(result.css);
  if (!css.trim()) {
    // Sanitizer stripped everything dangerous — fall back to safe theme.
    const fb = sanitizeCss(FALLBACK_THEME.css);
    return {
      result: { ...FALLBACK_THEME, css: fb.css },
      provider: p.name,
      usedFallback: true,
      sanitizedRemovals: removed,
    };
  }

  return {
    result: { ...result, css },
    provider: p.name,
    usedFallback,
    sanitizedRemovals: removed,
  };
}
