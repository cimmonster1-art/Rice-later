/**
 * Central server configuration, read once from the environment.
 *
 * RiceLayer is free for everyone. To keep the shared, cloud-backed AI provider
 * affordable, the backend enforces a hard MONTHLY COST CAP (default $20/month)
 * across all anonymous traffic. A small slice of that budget is reserved so the
 * project owner always retains priority access even when the public pool is
 * exhausted (see services/priorityAccess.ts and services/usageBudget.ts).
 *
 * No secret is ever sent to the browser; everything here is server-only.
 */

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function str(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw && raw.trim() ? raw.trim() : fallback;
}

function list(name: string): string[] {
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ServerConfig {
  /** Hard ceiling on estimated AI spend per calendar month (USD). */
  monthlyBudgetUsd: number;
  /**
   * Portion of the monthly budget reserved exclusively for priority callers.
   * Anonymous traffic may spend up to (monthlyBudgetUsd - priorityReserveUsd);
   * priority callers may spend up to the full monthlyBudgetUsd.
   */
  priorityReserveUsd: number;
  /** Estimated cost of a single AI generation (USD). */
  estCostPerGenerationUsd: number;
  /** Owner email that the project grants priority access to (informational). */
  ownerEmail: string;
  /** Secret keys that grant priority access when presented as a header. */
  priorityKeys: string[];
  /** Standard per-IP requests-per-minute limit for AI generation. */
  perMinuteMax: number;
  /** Higher per-IP requests-per-minute limit for priority callers. */
  priorityPerMinuteMax: number;
  /** Optional path to persist budget usage across restarts. */
  budgetStateFile: string | null;
}

let cached: ServerConfig | null = null;

export function getConfig(): ServerConfig {
  if (cached) return cached;
  const monthlyBudgetUsd = num("MONTHLY_BUDGET_USD", 20);
  const priorityReserveUsd = Math.min(
    monthlyBudgetUsd,
    num("PRIORITY_RESERVE_USD", Math.round(monthlyBudgetUsd * 0.25 * 100) / 100)
  );
  cached = {
    monthlyBudgetUsd,
    priorityReserveUsd,
    estCostPerGenerationUsd: num("EST_COST_PER_GENERATION_USD", 0.002),
    ownerEmail: str("OWNER_EMAIL", "cimmonster1@gmail.com"),
    priorityKeys: list("PRIORITY_ACCESS_KEYS"),
    perMinuteMax: num("RATE_LIMIT_PER_MINUTE", 20),
    priorityPerMinuteMax: num("PRIORITY_RATE_LIMIT_PER_MINUTE", 120),
    budgetStateFile: process.env.BUDGET_STATE_FILE?.trim() || null,
  };
  return cached;
}

/** Test seam: clear the memoized config so env changes take effect. */
export function __resetConfigForTests(): void {
  cached = null;
}

/**
 * Whether a real, paid AI provider is configured. When false, RiceLayer serves
 * the free local mock provider and no budget accounting is needed.
 */
export function isPaidProviderConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "";
}
