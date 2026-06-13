/**
 * POST /api/generate-theme
 *
 * Validates the request, checks entitlement + rate limit, builds a
 * privacy-preserving prompt, asks the AI provider for strict JSON, validates
 * and sanitizes it, then returns a ThemeGenerationResult.
 */
import { Router } from "express";
import { GenerateThemeRequestSchema } from "../schemas/request.js";
import { generateTheme } from "../services/aiThemeGenerator.js";
import { resolveTier } from "../services/entitlement.js";
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

    const { prompt, hostname, pageSummary, userTier } = parsed.data;

    // Entitlement: server is the source of truth; declared tier is advisory.
    const customerId =
      typeof req.headers["x-ricelayer-customer"] === "string"
        ? (req.headers["x-ricelayer-customer"] as string)
        : undefined;
    const tier = resolveTier(userTier, customerId);

    try {
      const outcome = await generateTheme({
        prompt,
        hostname,
        pageSummary,
        userTier: tier,
      });

      // Return the validated, sanitized ThemeGenerationResult as the body.
      // (Extra metadata is exposed under non-conflicting keys.)
      res.json({
        ...outcome.result,
        _meta: {
          provider: outcome.provider,
          usedFallback: outcome.usedFallback,
          sanitizedRemovals: outcome.sanitizedRemovals,
          tier,
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
