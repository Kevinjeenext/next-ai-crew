/**
 * Billing API Routes
 * Provider-neutral: StepPay (Phase 1) / Stripe (Phase 2)
 *
 * GET  /api/billing/plans         — Public plan list
 * GET  /api/billing/subscription  — Current org subscription
 * POST /api/billing/checkout      — Create checkout session
 * POST /api/billing/portal        — Customer portal (manage subscription)
 * POST /api/webhooks/payment      — Payment webhook receiver
 */

import { Router } from "express";
import express from "express";
import { supabaseAdmin, SUPABASE_CONFIGURED } from "../../lib/supabase.ts";
import { checkAgentLimit } from "../../middleware/plan-limit.ts";
import { getPaymentGateway } from "../../payment/gateway.ts";
import { processWebhookEvent } from "../../payment/webhook-handler.ts";

const router = Router();

/**
 * GET /api/billing/plans — Public plan list (from plan_limits table)
 */
router.get("/plans", async (_req, res) => {
  if (!SUPABASE_CONFIGURED) {
    return res.json({
      plans: [
        { plan: "free", agent_limit: 1, display_name: "Free", price_monthly_cents: 0, trial_days: 7, sort_order: 0 },
        { plan: "starter", agent_limit: 3, display_name: "Starter", price_monthly_cents: 2900, trial_days: 0, sort_order: 1 },
        { plan: "pro", agent_limit: 5, display_name: "Pro", price_monthly_cents: 7900, trial_days: 0, sort_order: 2 },
        { plan: "max", agent_limit: 10, display_name: "Max", price_monthly_cents: 19900, trial_days: 0, sort_order: 3 },
        { plan: "enterprise", agent_limit: -1, display_name: "Enterprise", price_monthly_cents: 0, trial_days: 0, sort_order: 4 },
      ],
    });
  }

  const { data, error } = await supabaseAdmin
    .from("plan_limits")
    .select("plan, agent_limit, display_name, price_monthly_cents, trial_days, features, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[billing] Failed to fetch plans:", error.message);
    return res.status(500).json({ error: "Failed to fetch plans" });
  }

  res.json({ plans: data });
});

/**
 * GET /api/billing/subscription — Current org subscription status
 */
router.get("/subscription", async (req: any, res) => {
  const orgId = req.orgId;
  if (!orgId) return res.status(401).json({ error: "unauthorized" });

  if (!SUPABASE_CONFIGURED) {
    return res.json({
      plan: "free",
      is_trial: true,
      trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      agent_limit: 1,
      agent_current: 0,
      provider: "steppay",
    });
  }

  try {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("plan, is_trial, trial_ends_at, agent_limit")
      .eq("id", orgId)
      .single();

    const agentInfo = await checkAgentLimit(orgId);

    res.json({
      plan: org?.plan ?? "free",
      is_trial: org?.is_trial ?? true,
      trial_ends_at: org?.trial_ends_at,
      agent_limit: org?.agent_limit ?? 1,
      agent_current: agentInfo.current,
      provider: process.env.PAYMENT_GATEWAY || "steppay",
    });
  } catch (err: any) {
    console.error("[billing] Subscription fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

/**
 * POST /api/billing/checkout — Create payment checkout session
 * Body: { plan: "pro" | "max" | ... }
 */
router.post("/checkout", express.json(), async (req: any, res) => {
  const orgId = req.orgId;
  if (!orgId) return res.status(401).json({ error: "unauthorized" });

  const { plan } = req.body;
  if (!plan || !["starter", "pro", "max", "enterprise"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  if (plan === "enterprise") {
    return res.json({ url: "/contact-sales", message: "Please contact sales for Enterprise plan." });
  }

  try {
    const gateway = getPaymentGateway();

    // Ensure customer exists
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("payment_customer_id, name")
      .eq("id", orgId)
      .single();

    // Get user email from auth context
    const userEmail = req.userEmail || "unknown@nextaicrew.com";
    const customerId = await gateway.ensureCustomer(orgId, userEmail, org?.name);

    // Create checkout
    const origin = req.headers.origin || "https://nextaicrew.com";
    const result = await gateway.createCheckout(orgId, plan, {
      customerId,
      successUrl: `${origin}/office?upgraded=true`,
      cancelUrl: `${origin}/pricing`,
    });

    res.json(result);
  } catch (err: any) {
    console.error("[billing] Checkout error:", err.message);
    if (err.message.includes("not configured")) {
      return res.status(503).json({
        error: "Payment not configured",
        message: "결제 시스템이 아직 설정되지 않았습니다. 관리자에게 문의하세요.",
      });
    }
    res.status(500).json({ error: "Failed to create checkout" });
  }
});

export default router;

/**
 * Webhook route — mounted separately at /api/webhooks/payment
 * Needs raw body for signature verification (future)
 */
export const webhookRouter = Router();

webhookRouter.post("/payment", express.json(), async (req, res) => {
  try {
    const gateway = getPaymentGateway();
    const event = await gateway.handleWebhook(req);
    await processWebhookEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error("[webhook] Error:", err.message);
    // Always return 200 to prevent StepPay from retrying indefinitely
    res.status(200).json({ received: true, error: err.message });
  }
});
