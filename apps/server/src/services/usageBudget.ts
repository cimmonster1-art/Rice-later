/**
 * usageBudget — enforces a hard monthly cost ceiling for AI generation.
 *
 * RiceLayer is free for everyone, so the shared cloud AI provider is protected
 * by a budget rather than a paywall. Estimated spend is tracked per calendar
 * month and reset automatically when the month rolls over. A reserved slice of
 * the budget is kept available for priority (owner) callers so they retain
 * access even after anonymous traffic has drained the shared pool.
 *
 * State is optionally persisted to a JSON file so the cap survives restarts.
 * The store is dependency-free and safe to call from a single Node process.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getConfig } from "../config.js";

interface BudgetState {
  /** Calendar month key, e.g. "2026-06". */
  month: string;
  /** Estimated USD spent this month. */
  spentUsd: number;
}

export interface BudgetUsage {
  month: string;
  spentUsd: number;
  budgetUsd: number;
  remainingUsd: number;
  /** Remaining budget available to anonymous (non-priority) callers. */
  publicRemainingUsd: number;
  exhausted: boolean;
}

function currentMonth(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

let state: BudgetState | null = null;

function load(): BudgetState {
  if (state) return rollover(state);
  const file = getConfig().budgetStateFile;
  if (file && existsSync(file)) {
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as BudgetState;
      if (typeof parsed.month === "string" && typeof parsed.spentUsd === "number") {
        state = parsed;
        return rollover(state);
      }
    } catch {
      /* corrupt file — start fresh */
    }
  }
  state = { month: currentMonth(), spentUsd: 0 };
  return state;
}

function rollover(s: BudgetState): BudgetState {
  const month = currentMonth();
  if (s.month !== month) {
    s.month = month;
    s.spentUsd = 0;
    persist(s);
  }
  return s;
}

function persist(s: BudgetState): void {
  const file = getConfig().budgetStateFile;
  if (!file) return;
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(s), "utf8");
  } catch {
    /* persistence is best-effort; never block a request on disk errors */
  }
}

/**
 * Attempt to reserve `costUsd` of budget. Priority callers may draw on the full
 * monthly budget; anonymous callers are limited to (budget - reserve).
 * Returns true and records the spend when allowed; false when it would exceed
 * the applicable limit.
 */
export function tryReserve(costUsd: number, opts: { priority: boolean }): boolean {
  const cfg = getConfig();
  const s = load();
  const limit = opts.priority
    ? cfg.monthlyBudgetUsd
    : Math.max(0, cfg.monthlyBudgetUsd - cfg.priorityReserveUsd);
  if (round(s.spentUsd + costUsd) > limit) return false;
  s.spentUsd = round(s.spentUsd + costUsd);
  persist(s);
  return true;
}

/** Refund a previously reserved cost (e.g. when generation failed). */
export function refund(costUsd: number): void {
  const s = load();
  s.spentUsd = Math.max(0, round(s.spentUsd - costUsd));
  persist(s);
}

export function getUsage(): BudgetUsage {
  const cfg = getConfig();
  const s = load();
  const remaining = Math.max(0, round(cfg.monthlyBudgetUsd - s.spentUsd));
  const publicCeiling = Math.max(0, cfg.monthlyBudgetUsd - cfg.priorityReserveUsd);
  return {
    month: s.month,
    spentUsd: s.spentUsd,
    budgetUsd: cfg.monthlyBudgetUsd,
    remainingUsd: remaining,
    publicRemainingUsd: Math.max(0, round(publicCeiling - s.spentUsd)),
    exhausted: remaining <= 0,
  };
}

/** Test seam: reset the in-memory budget state. */
export function __resetBudgetForTests(): void {
  state = null;
}
