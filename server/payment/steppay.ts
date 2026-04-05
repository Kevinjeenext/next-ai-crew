/**
 * StepPay Payment Gateway
 * API docs: https://docs.steppay.kr/
 *
 * Flow:
 *   1. Create customer (POST /api/v1/customers)
 *   2. Create order with price (POST /api/v1/orders)
 *   3. Order returns payment link → redirect user
 *   4. Payment completes → webhook fires
 *   5. Subscription auto-created by StepPay
 *
 * Auth: Secret-Token header
 * Webhook v2: { timestamp, version, event, data }
 */

import type {
  PaymentGateway,
  Subscription,
  CheckoutResult,
  WebhookEvent,
} from "./gateway.ts";
import { supabaseAdmin, SUPABASE_CONFIGURED } from "../lib/supabase.ts";

const STEPPAY_API = "https://api.steppay.kr/api/v1";

function getSecretToken(): string {
  const token = process.env.STEPPAY_SECRET_TOKEN;
  if (!token) throw new Error("STEPPAY_SECRET_TOKEN not configured");
  return token;
}

async function steppayFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${STEPPAY_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Secret-Token": getSecretToken(),
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[steppay] ${options.method || "GET"} ${path} → ${res.status}: ${body}`);
    throw new Error(`StepPay API error: ${res.status}`);
  }

  return res.json();
}

/** Map StepPay subscription status → our normalized status */
function mapStatus(steppayStatus: string): Subscription["status"] {
  const map: Record<string, Subscription["status"]> = {
    ACTIVE: "active",
    UNPAID: "past_due",
    CANCELED: "canceled",
    PAUSE: "paused",
    EXPIRED: "canceled",
  };
  return map[steppayStatus] || "active";
}

/** Map plan name → StepPay product price code (set by Kevin in portal) */
const PLAN_PRICE_CODES: Record<string, string> = {
  // These will be populated after Kevin sets up products in StepPay portal
  // starter: "price_xxx",
  // pro: "price_xxx",
  // max: "price_xxx",
};

function getPriceCode(plan: string): string {
  const code = PLAN_PRICE_CODES[plan] || process.env[`STEPPAY_PRICE_${plan.toUpperCase()}`];
  if (!code) throw new Error(`No StepPay price code configured for plan: ${plan}`);
  return code;
}

export class StepPayGateway implements PaymentGateway {
  readonly provider = "steppay";

  /**
   * Create or retrieve a StepPay customer
   */
  async ensureCustomer(orgId: string, email: string, name?: string): Promise<string> {
    // Check if org already has a payment_customer_id
    if (SUPABASE_CONFIGURED) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("payment_customer_id")
        .eq("id", orgId)
        .single();

      if (org?.payment_customer_id) return org.payment_customer_id;
    }

    // Create customer in StepPay
    const customer = await steppayFetch("/customers", {
      method: "POST",
      body: JSON.stringify({
        email,
        name: name || email,
        code: `org_${orgId}`, // unique customer code
      }),
    });

    const customerId = String(customer.id);

    // Save to our DB
    if (SUPABASE_CONFIGURED) {
      await supabaseAdmin
        .from("organizations")
        .update({ payment_customer_id: customerId })
        .eq("id", orgId);
    }

    return customerId;
  }

  /**
   * Create a checkout order → return payment link
   */
  async createCheckout(orgId: string, plan: string, options?: {
    successUrl?: string;
    cancelUrl?: string;
    customerId?: string;
  }): Promise<CheckoutResult> {
    const customerId = options?.customerId;
    if (!customerId) throw new Error("customerId required for StepPay checkout");

    const priceCode = getPriceCode(plan);

    // Create order via StepPay API
    const order = await steppayFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        customerId: Number(customerId),
        items: [
          {
            priceId: Number(priceCode),
            quantity: 1,
          },
        ],
        // StepPay generates a payment link from the order
      }),
    });

    // StepPay order response includes payment link
    // The link pattern: order.orderSheet or order.paymentLink
    const paymentUrl = order.orderSheet || order.paymentLink
      || `https://store.steppay.kr/order/${order.id}`;

    return {
      url: paymentUrl,
      orderId: String(order.id),
    };
  }

  /**
   * Parse StepPay webhook v2 payload
   * Format: { timestamp, version, event, data }
   */
  async handleWebhook(req: any): Promise<WebhookEvent> {
    const body = req.body;

    if (!body || !body.event) {
      throw new Error("Invalid StepPay webhook payload");
    }

    return {
      eventId: `sp_${body.timestamp}_${body.event}`,
      eventType: body.event,
      data: body.data || {},
      timestamp: body.timestamp,
    };
  }

  /**
   * Get subscription for an org from our DB
   */
  async getSubscription(orgId: string): Promise<Subscription | null> {
    if (!SUPABASE_CONFIGURED) return null;

    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("org_id", orgId)
      .eq("provider", "steppay")
      .in("status", ["active", "trialing", "past_due", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      id: data.payment_subscription_id,
      orgId: data.org_id,
      plan: data.plan,
      status: data.status,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAt: data.cancel_at,
      provider: "steppay",
    };
  }

  /**
   * Cancel a StepPay subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await steppayFetch(`/subscriptions/${subscriptionId}/cancel`, {
      method: "PUT",
    });
  }
}
