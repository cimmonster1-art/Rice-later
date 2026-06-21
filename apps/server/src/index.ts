/**
 * RiceLayer backend entry point.
 *
 * RiceLayer is fully free — there is no billing. The only safeguard on AI
 * generation is a hard Gemini spend cap (see services/geminiBudget.ts).
 *
 * Express server exposing:
 *   GET  /api/health
 *   POST /api/generate-theme
 */
import express from "express";
import { healthRouter } from "./routes/health.js";
import { generateThemeRouter } from "./routes/generateTheme.js";
import { securityHeaders, cors } from "./middleware/security.js";
import { createThemeProvider } from "./services/geminiThemeGenerator.js";

export function createApp(): express.Express {
  const app = express();

  app.use(securityHeaders);
  app.use(cors);
  app.use(express.json({ limit: "256kb" }));

  app.use("/api", healthRouter);
  app.use("/api", generateThemeRouter);

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
