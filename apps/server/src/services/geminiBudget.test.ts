import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  HARD_CAP_USD,
  getBudgetUsd,
  estimateCostUsd,
  recordUsage,
  isBudgetExhausted,
  assertBudgetAvailable,
  GeminiBudgetExceededError,
  getRemainingUsd,
  budgetStatus,
  __resetBudgetForTests,
  __setSpentForTests,
} from "./geminiBudget.js";

describe("geminiBudget (hard $20 Gemini spend cap)", () => {
  beforeEach(() => {
    __resetBudgetForTests();
    delete process.env.GEMINI_BUDGET_USD;
    delete process.env.GEMINI_PRICE_INPUT_PER_MTOK;
    delete process.env.GEMINI_PRICE_OUTPUT_PER_MTOK;
  });

  afterEach(() => {
    __resetBudgetForTests();
    delete process.env.GEMINI_BUDGET_USD;
  });

  it("defaults the budget to the $20 hard cap", () => {
    expect(HARD_CAP_USD).toBe(20);
    expect(getBudgetUsd()).toBe(20);
  });

  it("clamps any configured budget down to the hard cap (never above $20)", () => {
    process.env.GEMINI_BUDGET_USD = "1000";
    expect(getBudgetUsd()).toBe(20);
  });

  it("allows lowering the budget below the cap (for testing/ops)", () => {
    process.env.GEMINI_BUDGET_USD = "5";
    expect(getBudgetUsd()).toBe(5);
  });

  it("estimates cost from token usage", () => {
    // 1M input @ $0.30 + 1M output @ $2.50 = $2.80
    const cost = estimateCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000 });
    expect(cost).toBeCloseTo(2.8, 5);
  });

  it("accumulates spend and reports remaining budget", () => {
    recordUsage({ inputTokens: 1_000_000, outputTokens: 0 }); // $0.30
    expect(getRemainingUsd()).toBeCloseTo(19.7, 5);
    expect(isBudgetExhausted()).toBe(false);
  });

  it("marks the budget exhausted once spend reaches the cap", () => {
    __setSpentForTests(20);
    expect(isBudgetExhausted()).toBe(true);
    expect(getRemainingUsd()).toBe(0);
  });

  it("assertBudgetAvailable throws once the cap is reached", () => {
    __setSpentForTests(20.01);
    expect(() => assertBudgetAvailable()).toThrow(GeminiBudgetExceededError);
  });

  it("assertBudgetAvailable does not throw while under budget", () => {
    __setSpentForTests(19.99);
    expect(() => assertBudgetAvailable()).not.toThrow();
  });

  it("exposes a budget status snapshot", () => {
    __setSpentForTests(2);
    const s = budgetStatus();
    expect(s.capUsd).toBe(20);
    expect(s.spentUsd).toBe(2);
    expect(s.remainingUsd).toBe(18);
    expect(s.exhausted).toBe(false);
  });
});
