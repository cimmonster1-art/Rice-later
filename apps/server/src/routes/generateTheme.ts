/**
 * POST /api/generate-theme
 *
 * Validates the request, applies a per-IP rate limit, builds a
 * privacy-preserving prompt, asks the AI provider for strict JSON, validates
 * and sanitizes it, then returns a ThemeGenerationResult.
 *
 * RiceLayer is fully free: there is no tier/entitlement check. Cost is bounded
 * by a hard Gemini spend cap enforced inside the provider.
 */
import { Router } from "express";
import { GenerateThemeRequestSchema } from "../schemas/request.js";
import { generateTheme } from "../services/aiThemeGenerator.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const generateThemeRouter = Router();

generateThemeRouter.post(
  "/generate-theme",
  rateLimit({ windowMs: 60_000, max: 20 }),
  async (req, res) => {
    const parsed = GenerateThemeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { prompt, hostname, pageSummary } = parsed.data;

    try {
      const outcome = await generateTheme({ prompt, hostname, pageSummary });

      // Return the validated, sanitized ThemeGenerationResult as the body.
      // (Extra metadata is exposed under non-conflicting keys.)
      res.json({
        ...outcome.result,
        _meta: {
          provider: outcome.provider,
          usedFallback: outcome.usedFallback,
          sanitizedRemovals: outcome.sanitizedRemovals,
        },
      });
    } catch (err) {
      res.status(500).json({
        error: "Theme generation failed",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
);
