/**
 * Billing API Routes
 * MVP: GET /api/billing/plans + GET /api/billing/subscription
 * Post-MVP: POST /api/billing/checkout, POST /api/webhooks/stripe
 */

import { Router } from "express";
import { supabaseAdmin, SUPABASE_CONFIGURED } from "../../lib/supabase.ts";
import { checkAgentLimit } from "../../middleware/plan-limit.ts";

const router = Router();

/**
 * GET /api/billing/plans — Public plan list (from plan_limits table)
 */
router.get("/plans", async (_req, res) => {
  if (!SUPABASE_CONFIGURED) {
    // Fallback static response
    return res.json({
      plans: [
        { plan: "free", agent_limit: 1, display_name: "Free", price_monthly_cents: 2000, trial_days: 7, sort_order: 0 },
        { plan: "starter", agent_limit: 3, display_name: "Starter", price_monthly_cents: 4000, trial_days: 0, sort_order: 1 },
        { plan: "pro", agent_limit: 5, display_name: "Pro", price_monthly_cents: 6000, trial_days: 0, sort_order: 2 },
        { plan: "max", agent_limit: 10, display_name: "Max", price_monthly_cents: 10000, trial_days: 0, sort_order: 3 },
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
 * Requires auth (orgId from requireOrg middleware)
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
    });
  } catch (err: any) {
    console.error("[billing] Subscription fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

/**
 * POST /api/billing/checkout — Create Stripe Checkout session
 * Placeholder: requires STRIPE_SECRET_KEY env var
 */
router.post("/checkout", async (req: any, res) => {
  const orgId = req.orgId;
  if (!orgId) return res.status(401).json({ error: "unauthorized" });

  const { plan } = req.body;
  if (!plan || !["starter", "pro", "max", "enterprise"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(503).json({
      error: "Stripe not configured",
      message: "Payment processing is not yet available. Please contact sales.",
    });
  }

  // TODO: Stripe Checkout session creation (post-MVP)
  res.status(501).json({ error: "Stripe checkout coming soon" });
});

export default router;
