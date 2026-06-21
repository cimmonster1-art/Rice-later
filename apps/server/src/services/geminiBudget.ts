/**
 * geminiBudget — a HARD spend cap on Google Gemini usage.
 *
 * RiceLayer is fully free for users. To keep that sustainable, real Gemini API
 * usage is bounded by a hard dollar cap (default $20). Once the estimated
 * cumulative spend reaches the cap, the provider refuses to call Gemini and the
 * orchestrator transparently serves the safe fallback theme instead — users are
 * never charged and the product keeps working.
 *
 * Cost is ESTIMATED from token usage reported by the API (usageMetadata) using
 * a simple price table. The estimate is intentionally conservative.
 *
 * NOTE: the running total lives in process memory. It resets on restart and is
 * per-instance. For a multi-instance deployment, back `spentUsd` with a shared
 * store (Redis / DB) using the same interface.
 */

/** Absolute hard cap. The effective budget can be lowered but never raised. */
export const HARD_CAP_USD = 20;

/** Default per-million-token prices for gemini-2.5-flash (USD). Estimates. */
const DEFAULT_INPUT_PRICE_PER_MTOK = 0.3;
const DEFAULT_OUTPUT_PRICE_PER_MTOK = 2.5;

function numFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Effective budget: env override (GEMINI_BUDGET_USD), clamped to HARD_CAP_USD. */
export function getBudgetUsd(): number {
  const configured = numFromEnv("GEMINI_BUDGET_USD", HARD_CAP_USD);
  return Math.min(configured, HARD_CAP_USD);
}

function inputPrice(): number {
  return numFromEnv("GEMINI_PRICE_INPUT_PER_MTOK", DEFAULT_INPUT_PRICE_PER_MTOK);
}

function outputPrice(): number {
  return numFromEnv("GEMINI_PRICE_OUTPUT_PER_MTOK", DEFAULT_OUTPUT_PRICE_PER_MTOK);
}

// Cumulative estimated spend for this process.
let spentUsd = 0;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/** Estimate the USD cost of a single request from its token usage. */
export function estimateCostUsd(usage: TokenUsage): number {
  const inTok = Math.max(0, usage.inputTokens || 0);
  const outTok = Math.max(0, usage.outputTokens || 0);
  return (inTok / 1_000_000) * inputPrice() + (outTok / 1_000_000) * outputPrice();
}

export function getSpentUsd(): number {
  return spentUsd;
}

export function getRemainingUsd(): number {
  return Math.max(0, getBudgetUsd() - spentUsd);
}

/** True once the hard cap has been reached — no further Gemini calls allowed. */
export function isBudgetExhausted(): boolean {
  return spentUsd >= getBudgetUsd();
}

/** Error thrown when a Gemini call is attempted after the cap is reached. */
export class GeminiBudgetExceededError extends Error {
  constructor() {
    super(
      `Gemini hard budget cap reached ($${getSpentUsd().toFixed(
        2
      )}/$${getBudgetUsd().toFixed(2)}). Serving safe fallback theme.`
    );
    this.name = "GeminiBudgetExceededError";
  }
}

/** Throw if the budget is already exhausted. Call before each Gemini request. */
export function assertBudgetAvailable(): void {
  if (isBudgetExhausted()) throw new GeminiBudgetExceededError();
}

/** Record estimated spend for a completed Gemini call. Returns the added cost. */
export function recordUsage(usage: TokenUsage): number {
  const cost = estimateCostUsd(usage);
  spentUsd += cost;
  return cost;
}

export interface BudgetStatus {
  capUsd: number;
  spentUsd: number;
  remainingUsd: number;
  exhausted: boolean;
}

export function budgetStatus(): BudgetStatus {
  return {
    capUsd: getBudgetUsd(),
    spentUsd: Number(spentUsd.toFixed(6)),
    remainingUsd: Number(getRemainingUsd().toFixed(6)),
    exhausted: isBudgetExhausted(),
  };
}

/** Test helper: reset the running total. */
export function __resetBudgetForTests(): void {
  spentUsd = 0;
}

/** Test helper: force the spend total (e.g. to simulate an exhausted cap). */
export function __setSpentForTests(value: number): void {
  spentUsd = value;
}
