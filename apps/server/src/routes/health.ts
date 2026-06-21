import { Router } from "express";
import { createThemeProvider } from "../services/geminiThemeGenerator.js";
import { budgetStatus } from "../services/geminiBudget.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ricelayer-server",
    aiProvider: createThemeProvider().name,
    // RiceLayer is fully free; AI cost is bounded by a hard Gemini spend cap.
    geminiBudget: budgetStatus(),
    time: new Date().toISOString(),
  });
});
