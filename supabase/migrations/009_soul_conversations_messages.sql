-- 009_soul_conversations_messages.sql
-- Adds per-message row columns to soul_conversations
-- Run in Supabase SQL Editor

-- Add columns for per-message storage
ALTER TABLE soul_conversations ADD COLUMN IF NOT EXISTS conversation_id UUID DEFAULT gen_random_uuid();
ALTER TABLE soul_conversations ADD COLUMN IF NOT EXISTS role TEXT CHECK(role IN ('user', 'assistant', 'system'));
ALTER TABLE soul_conversations ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE soul_conversations ADD COLUMN IF NOT EXISTS model_used TEXT;
ALTER TABLE soul_conversations ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;

-- Index for fast conversation lookups
CREATE INDEX IF NOT EXISTS idx_soul_conv_conversation_id ON soul_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_soul_conv_agent_org ON soul_conversations(agent_id, org_id, created_at DESC);

-- RLS: users can only see their org's conversations
ALTER TABLE soul_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "soul_conversations_org_access" ON soul_conversations;
CREATE POLICY "soul_conversations_org_access" ON soul_conversations
  FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
