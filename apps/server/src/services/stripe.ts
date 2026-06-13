/**
 * stripe — billing scaffold for RiceLayer Pro ($2.99/month).
 *
 * The Stripe client is lazily constructed only when STRIPE_SECRET_KEY exists.
 * Without it, billing endpoints return a clear "billing not configured"
 * response so local development keeps working.
 */

import Stripe from "stripe";
import { setSubscription, clearSubscription } from "./entitlement.js";

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client = new Stripe(key, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion });
  return client;
}

export function isBillingConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_PRO_MONTHLY;
}

const APP_URL = () => process.env.APP_URL || "http://localhost:3000";

export async function createCheckoutSession(opts: {
  email?: string;
  customerId?: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const price = process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!stripe || !price) {
    throw new Error("Billing not configured (missing STRIPE_SECRET_KEY / price).");
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer: opts.customerId,
    customer_email: opts.customerId ? undefined : opts.email,
    success_url: `${APP_URL()}/?checkout=success`,
    cancel_url: `${APP_URL()}/?checkout=cancel`,
    allow_promotion_codes: true,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}

export async function createPortalSession(customerId: string): Promise<{ url: string }> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Billing not configured.");
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: APP_URL(),
  });
  return { url: session.url };
}

/**
 * Handle a verified Stripe webhook event. Updates entitlement state.
 * Returns a short description for logging.
 */
export function handleWebhookEvent(event: Stripe.Event): string {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (customerId) setSubscription(customerId, "pro");
      return `checkout completed -> pro (${customerId})`;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const active = sub.status === "active" || sub.status === "trialing";
      if (active) setSubscription(customerId, "pro");
      else clearSubscription(customerId);
      return `subscription updated -> ${active ? "pro" : "free"} (${customerId})`;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      clearSubscription(customerId);
      return `subscription deleted -> free (${customerId})`;
    }
    default:
      return `ignored event ${event.type}`;
  }
}

/** Verify a webhook signature; throws on failure. */
export function constructWebhookEvent(
  payload: Buffer | string,
  signature: string | undefined
): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) throw new Error("Webhook not configured.");
  if (!signature) throw new Error("Missing stripe-signature header.");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
