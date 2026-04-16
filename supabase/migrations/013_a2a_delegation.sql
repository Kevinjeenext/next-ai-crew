-- 013_a2a_delegation.sql — A2A 협업 채팅: 위임 시스템
-- Mingu (Backend Developer) | 2026-04-16
-- Arch: CTO Soojin a2a_mingu.txt

-- 1. soul_messages 확장 — delegation 관련 컬럼
ALTER TABLE soul_messages DROP CONSTRAINT IF EXISTS soul_messages_message_type_check;
ALTER TABLE soul_messages ADD CONSTRAINT soul_messages_message_type_check
  CHECK(message_type IN ('text','chat','system','trigger','response','delegation','delegation_result'));

ALTER TABLE soul_messages ADD COLUMN IF NOT EXISTS delegation_id UUID;
ALTER TABLE soul_messages ADD COLUMN IF NOT EXISTS mentioned_soul_ids TEXT[];

-- 2. 위임 추적 테이블
CREATE TABLE IF NOT EXISTS soul_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES soul_rooms(id) ON DELETE CASCADE,

  -- 위임 관계
  from_soul_id TEXT NOT NULL,
  to_soul_id TEXT NOT NULL,

  -- 원본 메시지
  original_message TEXT NOT NULL,
  original_message_id UUID,

  -- 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
    'pending', 'in_progress', 'completed', 'failed', 'cancelled'
  )),

  -- 결과
  result_message TEXT,
  result_message_id UUID,

  -- 토큰
  tokens_used INTEGER DEFAULT 0,

  -- 위임 깊이 (무한 루프 방지)
  depth INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  FOREIGN KEY (org_id, from_soul_id) REFERENCES agents(org_id, id),
  FOREIGN KEY (org_id, to_soul_id) REFERENCES agents(org_id, id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_delegations_room ON soul_delegations(room_id);
CREATE INDEX IF NOT EXISTS idx_delegations_status ON soul_delegations(status);
CREATE INDEX IF NOT EXISTS idx_delegations_from ON soul_delegations(from_soul_id);
CREATE INDEX IF NOT EXISTS idx_delegations_to ON soul_delegations(to_soul_id);
CREATE INDEX IF NOT EXISTS idx_delegations_org ON soul_delegations(org_id);

-- RLS
ALTER TABLE soul_delegations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS soul_delegations_tenant ON soul_delegations;
CREATE POLICY soul_delegations_tenant ON soul_delegations FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

-- soul_messages delegation_id 인덱스
CREATE INDEX IF NOT EXISTS idx_soul_messages_delegation ON soul_messages(delegation_id)
  WHERE delegation_id IS NOT NULL;
