-- ============================================================
-- Next AI Crew — Supabase Schema DDL
-- Based on Claw-Empire base-schema.ts → PostgreSQL + RLS
-- CTO Soojin | 2026-04-05
-- ============================================================

-- ============================================================
-- 1. MULTI-TENANCY CORE
-- ============================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','pro','team','enterprise')),
  settings_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE org_members (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner','admin','member','viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- Helper: get current user's org_ids
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
$$;

-- ============================================================
-- 2. DEPARTMENTS (from Claw-Empire)
-- ============================================================

CREATE TABLE departments (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL DEFAULT '',
  name_ja TEXT NOT NULL DEFAULT '',
  name_zh TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '📁',
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  prompt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 99,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, id)
);

-- ============================================================
-- 3. AGENTS (from Claw-Empire)
-- ============================================================

CREATE TABLE agents (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL DEFAULT '',
  name_ja TEXT NOT NULL DEFAULT '',
  name_zh TEXT NOT NULL DEFAULT '',
  department_id TEXT,
  workflow_pack_key TEXT NOT NULL DEFAULT 'development',
  role TEXT NOT NULL DEFAULT 'junior' CHECK(role IN ('team_leader','senior','junior','intern')),
  acts_as_planning_leader BOOLEAN NOT NULL DEFAULT false,
  cli_provider TEXT CHECK(cli_provider IN ('claude','codex','gemini','opencode','kimi','copilot','antigravity','api')),
  oauth_account_id TEXT,
  api_provider_id TEXT,
  api_model TEXT,
  cli_model TEXT,
  cli_reasoning_level TEXT,
  avatar_emoji TEXT NOT NULL DEFAULT '🤖',
  sprite_number INTEGER,
  personality TEXT,
  status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','working','break','offline')),
  current_task_id TEXT,
  stats_tasks_done INTEGER DEFAULT 0,
  stats_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, id),
  FOREIGN KEY (org_id, department_id) REFERENCES departments(org_id, id)
);

-- ============================================================
-- 4. PROJECTS (from Claw-Empire)
-- ============================================================

CREATE TABLE projects (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  project_path TEXT NOT NULL DEFAULT '',
  core_goal TEXT NOT NULL DEFAULT '',
  default_pack_key TEXT NOT NULL DEFAULT 'development',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, id)
);

-- ============================================================
-- 5. TASKS (from Claw-Empire)
-- ============================================================

CREATE TABLE tasks (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  department_id TEXT,
  assigned_agent_id TEXT,
  project_id TEXT,
  status TEXT NOT NULL DEFAULT 'inbox' CHECK(status IN ('inbox','planned','collaborating','in_progress','review','done','cancelled','pending')),
  priority INTEGER DEFAULT 0,
  task_type TEXT DEFAULT 'general' CHECK(task_type IN ('general','development','design','analysis','presentation','documentation')),
  workflow_pack_key TEXT NOT NULL DEFAULT 'development',
  workflow_meta_json JSONB,
  output_format TEXT,
  project_path TEXT,
  result TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, id),
  FOREIGN KEY (org_id, department_id) REFERENCES departments(org_id, id),
  FOREIGN KEY (org_id, assigned_agent_id) REFERENCES agents(org_id, id),
  FOREIGN KEY (org_id, project_id) REFERENCES projects(org_id, id)
);

-- ============================================================
-- 6. SUBTASKS (from Claw-Empire)
-- ============================================================

CREATE TABLE subtasks (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','done','blocked')),
  assigned_agent_id TEXT,
  blocked_reason TEXT,
  cli_tool_use_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (org_id, id),
  FOREIGN KEY (org_id, task_id) REFERENCES tasks(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, assigned_agent_id) REFERENCES agents(org_id, id)
);

-- ============================================================
-- 7. MESSAGES (from Claw-Empire)
-- ============================================================

CREATE TABLE messages (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('ceo','agent','system')),
  sender_id TEXT,
  receiver_type TEXT NOT NULL CHECK(receiver_type IN ('agent','department','all')),
  receiver_id TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK(message_type IN ('chat','task_assign','announcement','directive','report','status_update')),
  task_id TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, id)
);

-- ============================================================
-- 8. TASK LOGS (from Claw-Empire)
-- ============================================================

CREATE TABLE task_logs (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. MEETING MINUTES (from Claw-Empire)
-- ============================================================

CREATE TABLE meeting_minutes (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  meeting_type TEXT NOT NULL CHECK(meeting_type IN ('planned','review')),
  round INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','revision_requested','failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, id)
);

CREATE TABLE meeting_minute_entries (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  speaker_agent_id TEXT,
  speaker_name TEXT NOT NULL,
  department_name TEXT,
  role_label TEXT,
  message_type TEXT NOT NULL DEFAULT 'chat',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. SETTINGS (per-org)
-- ============================================================

CREATE TABLE settings (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (org_id, key)
);

-- ============================================================
-- 11. WORKFLOW PACKS (shared, read-only for tenants)
-- ============================================================

CREATE TABLE workflow_packs (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  input_schema_json JSONB NOT NULL DEFAULT '{}',
  prompt_preset_json JSONB NOT NULL DEFAULT '{}',
  qa_rules_json JSONB NOT NULL DEFAULT '{}',
  output_template_json JSONB NOT NULL DEFAULT '{}',
  routing_keywords_json JSONB NOT NULL DEFAULT '{}',
  cost_profile_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. TASK REPORT ARCHIVES (from Claw-Empire)
-- ============================================================

CREATE TABLE task_report_archives (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  root_task_id TEXT NOT NULL,
  generated_by_agent_id TEXT,
  summary_markdown TEXT NOT NULL,
  source_snapshot_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, id)
);

-- ============================================================
-- 13. API PROVIDERS (per-org)
-- ============================================================

CREATE TABLE api_providers (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'openai' CHECK(type IN ('openai','anthropic','google','ollama','openrouter','together','groq','cerebras','custom')),
  base_url TEXT NOT NULL,
  api_key_enc TEXT,
  preset_key TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  models_cache JSONB,
  models_cached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, id)
);

-- ============================================================
-- 14. AUDIT LOG
-- ============================================================

CREATE TABLE task_creation_audits (
  id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_title TEXT,
  task_status TEXT,
  department_id TEXT,
  assigned_agent_id TEXT,
  source_task_id TEXT,
  task_type TEXT,
  project_path TEXT,
  trigger TEXT NOT NULL,
  trigger_detail TEXT,
  actor_type TEXT,
  actor_id TEXT,
  actor_name TEXT,
  request_id TEXT,
  payload_hash TEXT,
  payload_preview TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_tasks_status ON tasks(org_id, status, updated_at DESC);
CREATE INDEX idx_tasks_agent ON tasks(org_id, assigned_agent_id);
CREATE INDEX idx_tasks_dept ON tasks(org_id, department_id);
CREATE INDEX idx_subtasks_task ON subtasks(org_id, task_id);
CREATE INDEX idx_messages_receiver ON messages(org_id, receiver_type, receiver_id, created_at DESC);
CREATE INDEX idx_task_logs_task ON task_logs(org_id, task_id, created_at DESC);
CREATE INDEX idx_meeting_minutes_task ON meeting_minutes(org_id, task_id);
CREATE INDEX idx_meeting_entries_meeting ON meeting_minute_entries(org_id, meeting_id, seq);
CREATE INDEX idx_projects_recent ON projects(org_id, last_used_at DESC);
CREATE INDEX idx_task_report_archives_root ON task_report_archives(org_id, root_task_id);
CREATE INDEX idx_task_creation_audits_task ON task_creation_audits(org_id, task_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Organizations: owners/members can see their orgs
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_orgs" ON organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids()));
CREATE POLICY "users_create_orgs" ON organizations FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners_update_orgs" ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- Org members
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_see_own_org" ON org_members FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "admins_manage_members" ON org_members FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- Macro for tenant-scoped tables
-- Apply same pattern: USING (org_id IN (SELECT get_user_org_ids()))

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON departments FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON agents FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON projects FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON tasks FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON subtasks FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON messages FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON task_logs FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON meeting_minutes FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE meeting_minute_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON meeting_minute_entries FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON settings FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE task_report_archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON task_report_archives FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON api_providers FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

ALTER TABLE task_creation_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON task_creation_audits FOR ALL
  USING (org_id IN (SELECT get_user_org_ids()));

-- Workflow packs: read-only for all authenticated users
ALTER TABLE workflow_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read" ON workflow_packs FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- REALTIME: Enable for key tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE subtasks;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_minutes;
