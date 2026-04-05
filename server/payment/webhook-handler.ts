/**
 * Payment Webhook Handler — Process incoming payment events
 * Provider-neutral: works with any PaymentGateway implementation
 *
 * StepPay webhook v2 events:
 *   - subscription.created → create subscription record
 *   - subscription.updated → update plan/status
 *   - payment.completed → mark invoice paid
 *   - payment.failed → mark past_due
 *   - order.payment_completed → initial checkout complete
 */

import { supabaseAdmin, SUPABASE_CONFIGURED } from "../lib/supabase.ts";
import type { WebhookEvent } from "./gateway.ts";

/** Plan mapping from StepPay product to our plan names */
const PLAN_MAP: Record<string, string> = {
  // Will be populated from StepPay portal product codes
  // "product_code": "plan_name"
};

function resolvePlan(data: Record<string, any>): string {
  // Try to resolve from product code mapping
  const productCode = data.productCode || data.product?.code;
  if (productCode && PLAN_MAP[productCode]) return PLAN_MAP[productCode];

  // Fallback: check price/plan name in data
  return data.plan || data.planName || "starter";
}

export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  if (!SUPABASE_CONFIGURED) {
    console.log("[webhook] Supabase not configured, skipping event:", event.eventType);
    return;
  }

  // 1. Log event for audit trail
  await supabaseAdmin.from("billing_events").upsert({
    payment_event_id: event.eventId,
    event_type: event.eventType,
    payload: event.data,
    processed: false,
    provider: "steppay",
  }, { onConflict: "payment_event_id" });

  try {
    switch (event.eventType) {
      case "subscription.created":
        await handleSubscriptionCreated(event.data);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(event.data);
        break;
      case "payment.completed":
      case "order.payment_completed":
        await handlePaymentCompleted(event.data);
        break;
      case "payment.failed":
        await handlePaymentFailed(event.data);
        break;
      default:
        console.log("[webhook] Unhandled event:", event.eventType);
    }

    // Mark as processed
    await supabaseAdmin
      .from("billing_events")
      .update({ processed: true })
      .eq("payment_event_id", event.eventId);

  } catch (err: any) {
    console.error("[webhook] Processing error:", err.message);
    await supabaseAdmin
      .from("billing_events")
      .update({ error_message: err.message })
      .eq("payment_event_id", event.eventId);
    throw err;
  }
}

async function handleSubscriptionCreated(data: Record<string, any>) {
  const subscriptionId = String(data.id || data.subscriptionId);
  const customerId = String(data.customerId || data.customer?.id);
  const plan = resolvePlan(data);

  // Find org by payment_customer_id
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("payment_customer_id", customerId)
    .single();

  if (!org) {
    console.error("[webhook] No org found for customer:", customerId);
    return;
  }

  // Create subscription record
  await supabaseAdmin.from("subscriptions").upsert({
    org_id: org.id,
    payment_subscription_id: subscriptionId,
    payment_price_code: data.priceId ? String(data.priceId) : "unknown",
    plan,
    status: "active",
    current_period_start: data.startDate || new Date().toISOString(),
    current_period_end: data.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    provider: "steppay",
  }, { onConflict: "payment_subscription_id" });

  // Update org plan (triggers agent_limit sync via DB trigger)
  await supabaseAdmin
    .from("organizations")
    .update({ plan, is_trial: false })
    .eq("id", org.id);

  console.log(`[webhook] Subscription created: org=${org.id} plan=${plan}`);
}

async function handleSubscriptionUpdated(data: Record<string, any>) {
  const subscriptionId = String(data.id || data.subscriptionId);
  const steppayStatus = data.status || "ACTIVE";
  const plan = resolvePlan(data);

  const statusMap: Record<string, string> = {
    ACTIVE: "active",
    UNPAID: "past_due",
    CANCELED: "canceled",
    PAUSE: "paused",
    EXPIRED: "canceled",
  };
  const status = statusMap[steppayStatus] || "active";

  // Update subscription
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status,
      plan,
      updated_at: new Date().toISOString(),
    })
    .eq("payment_subscription_id", subscriptionId)
    .select("org_id")
    .single();

  if (!sub) return;

  // If canceled, downgrade org to free
  if (status === "canceled") {
    await supabaseAdmin
      .from("organizations")
      .update({ plan: "starter" })
      .eq("id", sub.org_id);

    // TODO: Set excess agents to offline
    console.log(`[webhook] Subscription canceled, org ${sub.org_id} → free`);
  } else {
    // Update org plan
    await supabaseAdmin
      .from("organizations")
      .update({ plan })
      .eq("id", sub.org_id);
  }
}

async function handlePaymentCompleted(data: Record<string, any>) {
  const orderId = String(data.orderId || data.id);
  const customerId = String(data.customerId || data.customer?.id);

  // Find org
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("payment_customer_id", customerId)
    .single();

  if (!org) return;

  // Record invoice
  await supabaseAdmin.from("invoices").upsert({
    org_id: org.id,
    payment_invoice_id: orderId,
    amount_cents: data.amount || data.paidAmount || 0,
    currency: "krw",
    status: "paid",
    paid_at: new Date().toISOString(),
    provider: "steppay",
  }, { onConflict: "payment_invoice_id" });

  console.log(`[webhook] Payment completed: org=${org.id} order=${orderId}`);
}

async function handlePaymentFailed(data: Record<string, any>) {
  const subscriptionId = String(data.subscriptionId || data.id);

  // Mark subscription as past_due
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("payment_subscription_id", subscriptionId);

  console.log(`[webhook] Payment failed for subscription: ${subscriptionId}`);
  // Grace period: 3 days (StepPay auto-retries at 1/3/5/10/14 days)
}
