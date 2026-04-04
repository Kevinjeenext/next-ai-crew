-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Next AI Crew — Supabase PostgreSQL Schema
-- Run in Supabase Dashboard > SQL Editor
-- Aligned with CTO Architecture Guide (2026-04-05)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ━━━ Organizations (multi-tenancy root) ━━━
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','pro','enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ━━━ Departments ━━━
CREATE TABLE IF NOT EXISTS departments (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  name_ja TEXT NOT NULL DEFAULT '',
  name_zh TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 99,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id)
);

-- ━━━ Office Pack Departments ━━━
CREATE TABLE IF NOT EXISTS office_pack_departments (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_pack_key TEXT NOT NULL,
  department_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  name_ja TEXT NOT NULL DEFAULT '',
  name_zh TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 99,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, workflow_pack_key, department_id)
);

-- ━━━ Agents ━━━
CREATE TABLE IF NOT EXISTS agents (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL DEFAULT '',
  name_ja TEXT NOT NULL DEFAULT '',
  name_zh TEXT NOT NULL DEFAULT '',
  department_id TEXT,
  workflow_pack_key TEXT NOT NULL DEFAULT 'development',
  role TEXT NOT NULL CHECK(role IN ('team_leader','senior','junior','intern')),
  acts_as_planning_leader BOOLEAN NOT NULL DEFAULT FALSE,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id),
  FOREIGN KEY (org_id, department_id) REFERENCES departments(org_id, id)
);

-- ━━━ Projects ━━━
CREATE TABLE IF NOT EXISTS projects (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  project_path TEXT NOT NULL,
  core_goal TEXT NOT NULL,
  default_pack_key TEXT NOT NULL DEFAULT 'development',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id)
);

-- ━━━ Workflow Packs ━━━
CREATE TABLE IF NOT EXISTS workflow_packs (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  input_schema_json JSONB NOT NULL,
  prompt_preset_json JSONB NOT NULL,
  qa_rules_json JSONB NOT NULL,
  output_template_json JSONB NOT NULL,
  routing_keywords_json JSONB NOT NULL,
  cost_profile_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, key)
);

-- ━━━ Tasks ━━━
CREATE TABLE IF NOT EXISTS tasks (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id),
  FOREIGN KEY (org_id, department_id) REFERENCES departments(org_id, id),
  FOREIGN KEY (org_id, assigned_agent_id) REFERENCES agents(org_id, id),
  FOREIGN KEY (org_id, project_id) REFERENCES projects(org_id, id)
);

-- ━━━ Task Creation Audits ━━━
CREATE TABLE IF NOT EXISTS task_creation_audits (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
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
  request_ip TEXT,
  user_agent TEXT,
  payload_hash TEXT,
  payload_preview TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id)
);

-- ━━━ Messages ━━━
CREATE TABLE IF NOT EXISTS messages (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('ceo','agent','system')),
  sender_id TEXT,
  receiver_type TEXT NOT NULL CHECK(receiver_type IN ('agent','department','all')),
  receiver_id TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK(message_type IN ('chat','task_assign','announcement','directive','report','status_update')),
  task_id TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id)
);

-- ━━━ Task Logs ━━━
CREATE TABLE IF NOT EXISTS task_logs (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ━━━ Task Interrupt Injections ━━━
CREATE TABLE IF NOT EXISTS task_interrupt_injections (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  actor_token_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ
);

-- ━━━ Meeting Minutes ━━━
CREATE TABLE IF NOT EXISTS meeting_minutes (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  meeting_type TEXT NOT NULL CHECK(meeting_type IN ('planned','review')),
  round INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','revision_requested','failed')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id)
);

-- ━━━ Meeting Minute Entries ━━━
CREATE TABLE IF NOT EXISTS meeting_minute_entries (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ━━━ Review Revision History ━━━
CREATE TABLE IF NOT EXISTS review_revision_history (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  normalized_note TEXT NOT NULL,
  raw_note TEXT NOT NULL,
  first_round INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, task_id, normalized_note)
);

-- ━━━ Settings ━━━
CREATE TABLE IF NOT EXISTS settings (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (org_id, key)
);

-- ━━━ OAuth Credentials (legacy, per-org) ━━━
CREATE TABLE IF NOT EXISTS oauth_credentials (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  source TEXT,
  encrypted_data TEXT NOT NULL,
  email TEXT,
  scope TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, provider)
);

-- ━━━ OAuth Accounts ━━━
CREATE TABLE IF NOT EXISTS oauth_accounts (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('github','google_antigravity')),
  source TEXT,
  label TEXT,
  email TEXT,
  scope TEXT,
  expires_at TIMESTAMPTZ,
  access_token_enc TEXT,
  refresh_token_enc TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
  priority INTEGER NOT NULL DEFAULT 100,
  model_override TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id)
);

-- ━━━ OAuth Active Accounts ━━━
CREATE TABLE IF NOT EXISTS oauth_active_accounts (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  account_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, provider, account_id)
);

-- ━━━ OAuth States ━━━
CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  verifier_enc TEXT NOT NULL,
  redirect_to TEXT
);

-- ━━━ CLI Usage Cache ━━━
CREATE TABLE IF NOT EXISTS cli_usage_cache (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  data_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, provider)
);

-- ━━━ Subtasks ━━━
CREATE TABLE IF NOT EXISTS subtasks (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','done','blocked')),
  assigned_agent_id TEXT,
  blocked_reason TEXT,
  cli_tool_use_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (org_id, id)
);

-- ━━━ Task Report Archives ━━━
CREATE TABLE IF NOT EXISTS task_report_archives (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  root_task_id TEXT NOT NULL,
  generated_by_agent_id TEXT,
  summary_markdown TEXT NOT NULL,
  source_snapshot_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id),
  UNIQUE(org_id, root_task_id)
);

-- ━━━ Project Review Decision States ━━━
CREATE TABLE IF NOT EXISTS project_review_decision_states (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  snapshot_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'collecting' CHECK(status IN ('collecting','ready','failed')),
  planner_summary TEXT,
  planner_agent_id TEXT,
  planner_agent_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, project_id)
);

-- ━━━ Project Review Decision Events ━━━
CREATE TABLE IF NOT EXISTS project_review_decision_events (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  snapshot_hash TEXT,
  event_type TEXT NOT NULL CHECK(event_type IN ('planning_summary','representative_pick','followup_request','start_review_meeting')),
  summary TEXT NOT NULL,
  selected_options_json JSONB,
  note TEXT,
  task_id TEXT,
  meeting_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ━━━ Review Round Decision States ━━━
CREATE TABLE IF NOT EXISTS review_round_decision_states (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id TEXT NOT NULL,
  snapshot_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'collecting' CHECK(status IN ('collecting','ready','failed')),
  planner_summary TEXT,
  planner_agent_id TEXT,
  planner_agent_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, meeting_id)
);

-- ━━━ Skill Learning History ━━━
CREATE TABLE IF NOT EXISTS skill_learning_history (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('claude','codex','gemini','opencode','kimi','copilot','antigravity','api')),
  repo TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  skill_label TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed')),
  command TEXT NOT NULL,
  error TEXT,
  run_started_at TIMESTAMPTZ,
  run_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id),
  UNIQUE(org_id, job_id, provider)
);

-- ━━━ API Providers ━━━
CREATE TABLE IF NOT EXISTS api_providers (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'openai' CHECK(type IN ('openai','anthropic','google','ollama','openrouter','together','groq','cerebras','custom')),
  base_url TEXT NOT NULL,
  api_key_enc TEXT,
  preset_key TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  models_cache JSONB,
  models_cached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, id)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Indexes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(org_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_report_archives_root ON task_report_archives(org_id, root_task_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(org_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(org_id, assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks(org_id, department_id);
CREATE INDEX IF NOT EXISTS idx_projects_recent ON projects(org_id, last_used_at DESC NULLS LAST, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_creation_audits_task ON task_creation_audits(org_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_creation_audits_trigger ON task_creation_audits(org_id, trigger, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_logs_task ON task_logs(org_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_interrupt_injections_task ON task_interrupt_injections(org_id, task_id, session_id, consumed_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(org_id, receiver_type, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_task ON meeting_minutes(org_id, task_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_minute_entries_meeting ON meeting_minute_entries(org_id, meeting_id, seq ASC);
CREATE INDEX IF NOT EXISTS idx_review_revision_history_task ON review_revision_history(org_id, task_id, first_round DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(org_id, provider, status, priority, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_active_accounts_provider ON oauth_active_accounts(org_id, provider, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_learning_history_provider ON skill_learning_history(org_id, provider, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_learning_history_lookup ON skill_learning_history(org_id, provider, repo, skill_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_review_decision_states ON project_review_decision_states(org_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_review_decision_events ON project_review_decision_events(org_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_round_decision_states ON review_round_decision_states(org_id, updated_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Row Level Security (RLS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_pack_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_creation_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_interrupt_injections ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minute_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_revision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_active_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cli_usage_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_report_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_review_decision_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_review_decision_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_round_decision_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_learning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added in Day 2 (Auth + multi-tenancy sprint)
-- For now, service_role key bypasses RLS on server side

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Realtime (enable for key tables)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE subtasks;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_minutes;
