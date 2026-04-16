-- 011_a2a_enhancements.sql — A2A 통신 고도화
-- Mingu (Backend Developer) | 2026-04-16
-- 읽음 표시, 메시지 인덱스 강화

-- 1. soul_room_members에 last_read_at 추가 (읽음 표시)
ALTER TABLE soul_room_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- 2. soul_messages 인덱스 강화 (unread count 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_soul_messages_sender ON soul_messages(sender_soul_id);
CREATE INDEX IF NOT EXISTS idx_soul_messages_room_created ON soul_messages(room_id, created_at DESC);

-- 3. soul_rooms에 last_message_at 추가 (방 목록 정렬 최적화)
ALTER TABLE soul_rooms ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT now();

-- 4. RLS (010 DDL에서 누락된 경우)
ALTER TABLE soul_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_messages ENABLE ROW LEVEL SECURITY;

-- Tenant isolation
DROP POLICY IF EXISTS soul_rooms_tenant ON soul_rooms;
CREATE POLICY soul_rooms_tenant ON soul_rooms FOR ALL 
  USING (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS soul_messages_tenant ON soul_messages;
CREATE POLICY soul_messages_tenant ON soul_messages FOR ALL 
  USING (org_id IN (SELECT get_user_org_ids()));

-- Service role bypass (server-side)
DROP POLICY IF EXISTS soul_rooms_service ON soul_rooms;
CREATE POLICY soul_rooms_service ON soul_rooms FOR ALL 
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS soul_messages_service ON soul_messages;
CREATE POLICY soul_messages_service ON soul_messages FOR ALL 
  USING (true) WITH CHECK (true);
