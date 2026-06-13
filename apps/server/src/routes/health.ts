import { Router } from "express";
import { createThemeProvider } from "../services/geminiThemeGenerator.js";
import { isBillingConfigured } from "../services/stripe.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ricelayer-server",
    aiProvider: createThemeProvider().name,
    billingConfigured: isBillingConfigured(),
    time: new Date().toISOString(),
  });
});
