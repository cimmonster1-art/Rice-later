/**
 * Stripe billing routes for RiceLayer Pro ($2.99/month).
 *
 * The webhook route expects a RAW body (configured in index.ts) for signature
 * verification; the others use parsed JSON.
 */
import { Router, raw } from "express";
import {
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  handleWebhookEvent,
  isBillingConfigured,
} from "../services/stripe.js";
import { CheckoutRequestSchema, PortalRequestSchema } from "../schemas/request.js";

export const billingRouter = Router();

billingRouter.get("/billing/status", (_req, res) => {
  res.json({ configured: isBillingConfigured(), price: "$2.99/month" });
});

billingRouter.post("/billing/create-checkout-session", async (req, res) => {
  const parsed = CheckoutRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const out = await createCheckoutSession(parsed.data);
    res.json(out);
  } catch (err) {
    res.status(503).json({
      error: err instanceof Error ? err.message : "Billing unavailable",
    });
  }
});

billingRouter.post("/billing/create-portal-session", async (req, res) => {
  const parsed = PortalRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const out = await createPortalSession(parsed.data.customerId);
    res.json(out);
  } catch (err) {
    res.status(503).json({
      error: err instanceof Error ? err.message : "Billing unavailable",
    });
  }
});

// Raw body needed for Stripe signature verification.
billingRouter.post(
  "/billing/webhook",
  raw({ type: "application/json" }),
  (req, res) => {
    try {
      const event = constructWebhookEvent(
        req.body as Buffer,
        req.headers["stripe-signature"] as string | undefined
      );
      const summary = handleWebhookEvent(event);
      console.log(`[RiceLayer] stripe webhook: ${summary}`);
      res.json({ received: true });
    } catch (err) {
      res.status(400).json({
        error: `Webhook error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }
);
