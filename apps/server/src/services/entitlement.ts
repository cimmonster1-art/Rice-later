/**
 * entitlement — decides whether a caller is on the free or pro tier.
 *
 * For now this is a dev-friendly stub backed by an in-memory store, with a
 * clean interface so Stripe (or a DB) can enforce Pro later. Local development
 * is never blocked.
 */

export type Tier = "free" | "pro";

interface SubscriptionRecord {
  tier: Tier;
  customerId?: string;
  updatedAt: string;
}

/** In-memory dev store keyed by customer id. Swap for a DB in production. */
const store = new Map<string, SubscriptionRecord>();

export function setSubscription(customerId: string, tier: Tier): void {
  store.set(customerId, { tier, customerId, updatedAt: new Date().toISOString() });
}

export function clearSubscription(customerId: string): void {
  store.set(customerId, {
    tier: "free",
    customerId,
    updatedAt: new Date().toISOString(),
  });
}

export function getTier(customerId?: string): Tier {
  // Dev override: unlock pro for everyone without Stripe.
  if (process.env.DEV_FORCE_TIER === "pro") return "pro";
  if (customerId && store.has(customerId)) {
    return store.get(customerId)!.tier;
  }
  return "free";
}

/**
 * Resolve the effective tier for a request. Trusts the client-declared tier
 * only up to "free" privileges; Pro must be backed by a subscription or the
 * dev override. (The extension also enforces free limits locally.)
 */
export function resolveTier(declared: Tier, customerId?: string): Tier {
  // The server is the source of truth. A client may *declare* "pro", but
  // without a backing subscription (or the dev override) it stays "free".
  void declared;
  return getTier(customerId);
}

export function isPro(customerId?: string): boolean {
  return getTier(customerId) === "pro";
}
