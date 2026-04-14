-- 010_soul_a2a.sql — Soul간 A2A 통신 테이블
-- Kevin Supabase SQL Editor에서 실행

-- 1. Soul 대화방
CREATE TABLE IF NOT EXISTS soul_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT,
  room_type TEXT DEFAULT 'direct' CHECK(room_type IN ('direct','group','department')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_soul_rooms_org ON soul_rooms(org_id);

-- 2. 방 멤버
CREATE TABLE IF NOT EXISTS soul_room_members (
  room_id UUID REFERENCES soul_rooms(id) ON DELETE CASCADE,
  soul_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, soul_id)
);

-- 3. 메시지
CREATE TABLE IF NOT EXISTS soul_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  room_id UUID REFERENCES soul_rooms(id) ON DELETE CASCADE,
  sender_soul_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text','system','trigger','response')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_soul_messages_room ON soul_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_soul_messages_org ON soul_messages(org_id);
