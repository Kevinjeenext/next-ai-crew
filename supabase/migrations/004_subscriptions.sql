-- ============================================================
-- Next AI Crew — Subscription & Billing DDL
-- Migration 004: Provider-neutral billing (StepPay/Stripe)
-- CTO Soojin | 2026-04-05 (updated: provider-neutral fields)
-- ============================================================

-- ============================================================
-- 1. UPDATE organizations.plan CHECK constraint
-- ============================================================

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('free','starter','pro','max','enterprise'));

-- Add trial + payment fields to organizations (provider-neutral)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS payment_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agent_limit INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN organizations.payment_customer_id IS
  'Payment provider customer ID (StepPay customerId or Stripe cus_xxx)';
COMMENT ON COLUMN organizations.agent_limit IS
  'free=1, starter=3, pro=5, max=10, enterprise=unlimited(-1)';

-- ============================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_subscription_id TEXT UNIQUE NOT NULL,
  payment_price_code TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free','starter','pro','max','enterprise')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  provider TEXT NOT NULL DEFAULT 'steppay' CHECK (provider IN ('steppay','stripe')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX idx_subscriptions_payment ON subscriptions(payment_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(org_id, status);

-- ============================================================
-- 3. BILLING EVENTS TABLE (webhook audit log)
-- ============================================================

CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  payment_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  provider TEXT NOT NULL DEFAULT 'steppay',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_billing_events_org ON billing_events(org_id, created_at DESC);
CREATE INDEX idx_billing_events_payment ON billing_events(payment_event_id);
CREATE INDEX idx_billing_events_unprocessed ON billing_events(processed) WHERE processed = false;

-- ============================================================
-- 4. INVOICES TABLE (payment history)
-- ============================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_invoice_id TEXT UNIQUE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'krw',
  status TEXT NOT NULL CHECK (status IN ('draft','open','paid','void','uncollectible')),
  invoice_url TEXT,
  pdf_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  provider TEXT NOT NULL DEFAULT 'steppay',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_org ON invoices(org_id, created_at DESC);

-- ============================================================
-- 5. PLAN LIMITS REFERENCE TABLE
-- ============================================================

CREATE TABLE plan_limits (
  plan TEXT PRIMARY KEY CHECK (plan IN ('free','starter','pro','max','enterprise')),
  agent_limit INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  price_monthly_cents INTEGER NOT NULL,
  payment_price_code TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  trial_days INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Seed plan limits (KRW: cents = 원)
INSERT INTO plan_limits (plan, agent_limit, display_name, price_monthly_cents, trial_days, sort_order, features) VALUES
  ('free',       1,  'Free',       2000,  7, 0, '{"workflows": "basic", "support": "community"}'),
  ('starter',    3,  'Starter',    4000,  0, 1, '{"workflows": "basic", "support": "email", "social_login": true}'),
  ('pro',        5,  'Pro',        6000,  0, 2, '{"workflows": "custom", "support": "priority", "api_access": true}'),
  ('max',       10,  'Max',       10000,  0, 3, '{"workflows": "custom", "support": "priority", "api_access": true, "analytics": true}'),
  ('enterprise',-1,  'Enterprise',    0,  0, 4, '{"workflows": "unlimited", "support": "dedicated", "sla": true, "custom_infra": true}');

-- ============================================================
-- 6. AUTO-SET TRIAL ON ORG CREATION
-- ============================================================

CREATE OR REPLACE FUNCTION set_org_trial()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_trial := true;
  NEW.trial_ends_at := now() + INTERVAL '7 days';
  NEW.agent_limit := 1;
  NEW.plan := 'free';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_org_created_set_trial
  BEFORE INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_org_trial();

-- ============================================================
-- 7. SYNC PLAN → AGENT_LIMIT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION sync_plan_agent_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    SELECT agent_limit INTO NEW.agent_limit
    FROM plan_limits WHERE plan = NEW.plan;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_org_plan_change
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION sync_plan_agent_limit();

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON subscriptions FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON billing_events FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON invoices FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

-- plan_limits: read-only for all authenticated users
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read" ON plan_limits FOR SELECT
  TO authenticated USING (true);
