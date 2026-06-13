/**
 * POST /api/generate-theme
 *
 * Validates the request, applies a per-IP rate limit and the monthly AI budget
 * guard, builds a privacy-preserving prompt, asks the AI provider for strict
 * JSON, validates and sanitizes it, then returns a ThemeGenerationResult.
 *
 * Every RiceLayer feature is free; the guards exist only to keep shared AI
 * costs bounded, never to gate functionality.
 */
import { Router } from "express";
import { GenerateThemeRequestSchema } from "../schemas/request.js";
import { generateTheme } from "../services/aiThemeGenerator.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { budgetGuard } from "../middleware/budgetGuard.js";
import { getConfig } from "../config.js";

export const generateThemeRouter = Router();

const cfg = getConfig();

generateThemeRouter.post(
  "/generate-theme",
  rateLimit({
    windowMs: 60_000,
    max: cfg.perMinuteMax,
    priorityMax: cfg.priorityPerMinuteMax,
  }),
  budgetGuard,
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
