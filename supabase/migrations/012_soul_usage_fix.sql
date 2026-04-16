-- 012_soul_usage_fix.sql — soul_usage 스키마 수정
-- Mingu (Backend Developer) | 2026-04-16
-- 이슈: 005_souls.sql의 agent_id UUID → agents.id는 TEXT (PK: org_id, id)
-- 이슈: 컬럼명이 usage-tracker.ts와 불일치

-- ============================================================
-- soul_usage 재생성 (기존 테이블 DROP 후 올바른 스키마로 생성)
-- ============================================================

-- 기존 테이블이 있으면 삭제 (데이터 없는 상태이므로 안전)
DROP TABLE IF EXISTS soul_usage CASCADE;

CREATE TABLE soul_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,                    -- agents.id = TEXT (not UUID)
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                      -- 'YYYY-MM'

  -- 토큰 사용량 (usage-tracker.ts와 일치)
  total_tokens BIGINT DEFAULT 0,
  prompt_tokens_sum BIGINT DEFAULT 0,
  completion_tokens_sum BIGINT DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  last_model_used TEXT,

  -- 기존 호환 필드 (분석용)
  model_breakdown JSONB DEFAULT '{}',
  cache_hits INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(agent_id, org_id, period),
  FOREIGN KEY (org_id, agent_id) REFERENCES agents(org_id, id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_soul_usage_org_period ON soul_usage(org_id, period);
CREATE INDEX idx_soul_usage_agent ON soul_usage(agent_id);

-- RLS
ALTER TABLE soul_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS soul_usage_tenant ON soul_usage;
CREATE POLICY soul_usage_tenant ON soul_usage FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

-- ============================================================
-- org_token_budgets 보정 (005에서 생성된 스키마와 usage-tracker 호환)
-- ============================================================

-- usage-tracker.ts가 사용하는 컬럼 추가 (기존 컬럼과 공존)
ALTER TABLE org_token_budgets ADD COLUMN IF NOT EXISTS tokens_used BIGINT DEFAULT 0;
ALTER TABLE org_token_budgets ADD COLUMN IF NOT EXISTS monthly_budget BIGINT DEFAULT 200000;
ALTER TABLE org_token_budgets ADD COLUMN IF NOT EXISTS auto_pause BOOLEAN DEFAULT true;
ALTER TABLE org_token_budgets ADD COLUMN IF NOT EXISTS alert_threshold INTEGER DEFAULT 80;
