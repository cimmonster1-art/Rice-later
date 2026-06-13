/**
 * RiceLayer backend entry point.
 *
 * Express server exposing:
 *   GET  /api/health
 *   POST /api/generate-theme
 *   POST /api/billing/create-checkout-session
 *   POST /api/billing/create-portal-session
 *   POST /api/billing/webhook   (raw body)
 */
import express from "express";
import { healthRouter } from "./routes/health.js";
import { generateThemeRouter } from "./routes/generateTheme.js";
import { billingRouter } from "./routes/billing.js";
import { securityHeaders, cors } from "./middleware/security.js";
import { createThemeProvider } from "./services/geminiThemeGenerator.js";

export function createApp(): express.Express {
  const app = express();

  app.use(securityHeaders);
  app.use(cors);

  // The Stripe webhook needs the raw body, so mount billing BEFORE json()
  // for that path. express.json() is applied to everything else.
  app.use((req, res, next) => {
    if (req.originalUrl === "/api/billing/webhook") return next();
    return express.json({ limit: "256kb" })(req, res, next);
  });

  app.use("/api", healthRouter);
  app.use("/api", generateThemeRouter);
  app.use("/api", billingRouter);

  app.get("/", (_req, res) => {
    res.json({ name: "RiceLayer API", status: "ok" });
  });

  return app;
}

// Start only when run directly (not when imported by tests).
const isMain =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const port = Number(process.env.PORT) || 8787;
  // Trigger the startup warning if GEMINI_API_KEY is missing.
  const provider = createThemeProvider();
  const app = createApp();
  app.listen(port, () => {
    console.log(`[RiceLayer] server listening on http://localhost:${port}`);
    console.log(`[RiceLayer] AI provider: ${provider.name}`);
  });
}
