/**
 * budgetGuard — enforces the monthly AI cost ceiling on generation requests.
 *
 * Free for everyone, but the shared cloud AI provider is capped at a fixed
 * monthly budget (default $20). When no paid provider is configured the local
 * mock provider is used, generation is free, and this guard is a no-op.
 *
 * On a reserved request that ultimately errors (5xx), the reserved cost is
 * refunded so transient failures don't burn the budget.
 */
import type { Request, Response, NextFunction } from "express";
import { getConfig, isPaidProviderConfigured } from "../config.js";
import { isPriorityRequest } from "../services/priorityAccess.js";
import { tryReserve, refund, getUsage } from "../services/usageBudget.js";

export function budgetGuard(req: Request, res: Response, next: NextFunction): void {
  // Free local provider: no spend to meter.
  if (!isPaidProviderConfigured()) {
    next();
    return;
  }

  const priority = isPriorityRequest(req);
  const cost = getConfig().estCostPerGenerationUsd;

  if (!tryReserve(cost, { priority })) {
    res.status(429).json({
      error: priority
        ? "Monthly AI budget reached for this period."
        : "RiceLayer's shared monthly AI budget is used up for now. Local presets and saved themes still work. It resets at the start of next month.",
      budget: getUsage(),
    });
    return;
  }

  // Refund the reservation if the request ends in a server error.
  res.on("finish", () => {
    if (res.statusCode >= 500) refund(cost);
  });

  next();
}
