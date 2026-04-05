/**
 * PaymentGateway — Provider-neutral billing interface
 * Phase 1: StepPay (Korea)
 * Phase 2: Stripe (International)
 */

export interface Subscription {
  id: string;
  orgId: string;
  plan: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  provider: string;
}

export interface CheckoutResult {
  url: string;
  orderId?: string;
}

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  data: Record<string, any>;
  timestamp: number;
}

export interface PaymentGateway {
  readonly provider: string;

  /** Create a checkout session → returns redirect URL */
  createCheckout(orgId: string, plan: string, options?: {
    successUrl?: string;
    cancelUrl?: string;
    customerId?: string;
  }): Promise<CheckoutResult>;

  /** Parse + verify incoming webhook, return normalized event */
  handleWebhook(req: any): Promise<WebhookEvent>;

  /** Get current subscription for an org */
  getSubscription(orgId: string): Promise<Subscription | null>;

  /** Create or get payment customer ID */
  ensureCustomer(orgId: string, email: string, name?: string): Promise<string>;

  /** Cancel subscription */
  cancelSubscription(subscriptionId: string): Promise<void>;
}

/**
 * Factory: get the active payment gateway
 */
export function getPaymentGateway(): PaymentGateway {
  const provider = process.env.PAYMENT_GATEWAY || "steppay";

  switch (provider) {
    case "steppay": {
      const { StepPayGateway } = require("./steppay.ts");
      return new StepPayGateway();
    }
    case "stripe": {
      // Phase 2
      throw new Error("Stripe gateway not yet implemented");
    }
    default:
      throw new Error(`Unknown payment gateway: ${provider}`);
  }
}
