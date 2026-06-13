import { Router } from "express";
import { createThemeProvider } from "../services/geminiThemeGenerator.js";
import { isPaidProviderConfigured } from "../config.js";
import { getUsage } from "../services/usageBudget.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ricelayer-server",
    aiProvider: createThemeProvider().name,
    budget: isPaidProviderConfigured() ? getUsage() : null,
    time: new Date().toISOString(),
  });
});
