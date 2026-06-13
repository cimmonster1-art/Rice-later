import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { __resetConfigForTests } from "../config.js";
import {
  tryReserve,
  refund,
  getUsage,
  __resetBudgetForTests,
} from "./usageBudget.js";

describe("usageBudget", () => {
  beforeEach(() => {
    __resetBudgetForTests();
    __resetConfigForTests();
    process.env.MONTHLY_BUDGET_USD = "1";
    process.env.PRIORITY_RESERVE_USD = "0.25";
  });

  afterEach(() => {
    delete process.env.MONTHLY_BUDGET_USD;
    delete process.env.PRIORITY_RESERVE_USD;
    __resetBudgetForTests();
    __resetConfigForTests();
  });

  it("allows anonymous spend up to (budget - reserve)", () => {
    // public ceiling = 1 - 0.25 = 0.75
    expect(tryReserve(0.5, { priority: false })).toBe(true);
    expect(tryReserve(0.25, { priority: false })).toBe(true);
    // next anonymous request would exceed 0.75
    expect(tryReserve(0.01, { priority: false })).toBe(false);
  });

  it("lets priority callers draw on the reserved budget", () => {
    expect(tryReserve(0.75, { priority: false })).toBe(true);
    // anonymous is now capped, but priority can use the remaining 0.25
    expect(tryReserve(0.2, { priority: false })).toBe(false);
    expect(tryReserve(0.2, { priority: true })).toBe(true);
  });

  it("never exceeds the hard monthly budget even for priority", () => {
    expect(tryReserve(1, { priority: true })).toBe(true);
    expect(tryReserve(0.01, { priority: true })).toBe(false);
    expect(getUsage().exhausted).toBe(true);
  });

  it("refunds reserved cost", () => {
    expect(tryReserve(0.7, { priority: false })).toBe(true);
    refund(0.7);
    expect(getUsage().spentUsd).toBe(0);
    expect(tryReserve(0.7, { priority: false })).toBe(true);
  });

  it("reports usage with public remaining", () => {
    tryReserve(0.5, { priority: false });
    const u = getUsage();
    expect(u.budgetUsd).toBe(1);
    expect(u.spentUsd).toBe(0.5);
    expect(u.remainingUsd).toBe(0.5);
    expect(u.publicRemainingUsd).toBe(0.25);
  });
});
