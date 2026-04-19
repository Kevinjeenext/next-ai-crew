-- 014_credit_system.sql
-- 크레딧 시스템 DDL — 조직별 잔고 + 거래 내역

-- 1. 조직별 크레딧 잔고
CREATE TABLE IF NOT EXISTS org_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 5000,
  total_earned INTEGER NOT NULL DEFAULT 5000,
  total_spent INTEGER NOT NULL DEFAULT 0,
  plan_credits INTEGER NOT NULL DEFAULT 5000,
  reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id)
);

-- 2. 크레딧 거래 내역
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  soul_id UUID REFERENCES souls(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'refund', 'reset')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  model TEXT,
  model_weight NUMERIC(3,1) DEFAULT 1.0,
  tokens_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_txn_org ON credit_transactions(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_txn_soul ON credit_transactions(soul_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_txn_type ON credit_transactions(org_id, type);

-- 3. Atomic credit deduction function
CREATE OR REPLACE FUNCTION deduct_credits(p_org_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE org_credits
  SET balance = GREATEST(0, balance - p_amount),
      total_spent = total_spent + p_amount,
      updated_at = now()
  WHERE org_id = p_org_id
  RETURNING balance INTO new_balance;
  
  IF NOT FOUND THEN
    -- Auto-create with default starter credits
    INSERT INTO org_credits (org_id, balance, total_earned, total_spent, plan_credits)
    VALUES (p_org_id, GREATEST(0, 5000 - p_amount), 5000, p_amount, 5000)
    RETURNING balance INTO new_balance;
  END IF;
  
  RETURN new_balance;
END;
$$;

-- 4. Monthly credit reset function
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE org_credits
  SET balance = plan_credits,
      total_spent = 0,
      reset_at = (date_trunc('month', now()) + interval '1 month'),
      updated_at = now()
  WHERE reset_at IS NOT NULL AND reset_at <= now();
  
  -- Record reset transactions
  INSERT INTO credit_transactions (org_id, type, amount, balance_after, description)
  SELECT org_id, 'reset', plan_credits, plan_credits, '월간 크레딧 리셋'
  FROM org_credits
  WHERE reset_at IS NOT NULL AND reset_at <= now();
END;
$$;

-- 5. RLS policies
ALTER TABLE org_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Members can read their org's credits
CREATE POLICY org_credits_read ON org_credits
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Members can read their org's transactions
CREATE POLICY credit_txn_read ON credit_transactions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Service role can do everything (for server-side operations)
CREATE POLICY org_credits_service ON org_credits
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY credit_txn_service ON credit_transactions
  FOR ALL USING (true) WITH CHECK (true);
