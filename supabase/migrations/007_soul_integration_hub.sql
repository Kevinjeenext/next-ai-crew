-- 007_soul_integration_hub.sql — Soul × Physical AI + Webhook + API + Playbook + Data Pipeline
-- Next AI Crew | CTO Soojin | 2026-04-12
-- Kevin 지시: Soul마다 피지컬AI/웹훅/API/플레이북/데이터파이프라인 연동
--
-- 의존: 006_admin_rbac.sql (profiles), 005_souls_v2.sql (agents)
-- 실행: Supabase SQL Editor에서 한 번에 실행

-- ============================================================
-- 1. soul_webhooks — 웹훅 엔진 (Inbound/Outbound)
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  
  -- 방향
  direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
  
  -- 설정
  name TEXT NOT NULL,
  url TEXT,                          -- outbound: 대상 URL / inbound: auto-generated
  endpoint_path TEXT,                -- inbound: /hooks/{endpoint_path}
  secret TEXT,                       -- HMAC 서명 시크릿
  
  -- 이벤트 필터
  events TEXT[] NOT NULL DEFAULT '{}',  -- ['message.received', 'task.completed', ...]
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 5000,
  
  -- 메타
  headers JSONB DEFAULT '{}',       -- 커스텀 헤더
  transform JSONB DEFAULT '{}',     -- 페이로드 변환 규칙
  metadata JSONB DEFAULT '{}',
  
  -- 통계
  last_triggered_at TIMESTAMPTZ,
  total_calls INTEGER DEFAULT 0,
  total_failures INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  FOREIGN KEY (org_id, agent_id) REFERENCES agents(org_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhooks_agent ON soul_webhooks(org_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_direction ON soul_webhooks(direction);
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhooks_endpoint ON soul_webhooks(endpoint_path) WHERE direction = 'inbound';

-- ============================================================
-- 2. soul_integrations — 외부 서비스 연동 레지스트리
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  
  -- 제공자
  provider TEXT NOT NULL,            -- 'slack', 'notion', 'google_sheets', 'salesforce', ...
  provider_type TEXT NOT NULL CHECK(provider_type IN ('api', 'oauth2', 'webhook', 'grpc', 'mqtt')),
  
  -- 연결 정보 (암호화 저장)
  config JSONB NOT NULL DEFAULT '{}',       -- 비밀번호 제외 설정
  credentials_encrypted TEXT,                -- AES-256 암호화된 자격증명
  
  -- OAuth2
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'connected', 'error', 'revoked')),
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- 권한 범위
  scopes TEXT[] DEFAULT '{}',
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  FOREIGN KEY (org_id, agent_id) REFERENCES agents(org_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_integrations_agent ON soul_integrations(org_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON soul_integrations(provider);

-- ============================================================
-- 3. soul_physical_devices — Physical AI Bridge
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_physical_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  
  -- 디바이스 정보
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK(device_type IN (
    'robot', 'kiosk', 'sensor', 'camera', 'display', 'speaker', 'custom'
  )),
  
  -- 연결 프로토콜
  protocol TEXT NOT NULL CHECK(protocol IN ('grpc', 'mqtt', 'ros2', 'http', 'websocket')),
  endpoint TEXT NOT NULL,            -- grpc://host:port, mqtt://broker:1883, ...
  
  -- 인증
  auth_type TEXT DEFAULT 'none' CHECK(auth_type IN ('none', 'token', 'cert', 'mtls')),
  auth_config_encrypted TEXT,        -- 암호화된 인증 정보
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'error', 'maintenance')),
  last_heartbeat_at TIMESTAMPTZ,
  last_command_at TIMESTAMPTZ,
  
  -- 센서 데이터
  last_telemetry JSONB DEFAULT '{}',  -- 최신 텔레메트리 스냅샷
  
  -- 재연결 정책
  auto_reconnect BOOLEAN DEFAULT true,
  reconnect_interval_ms INTEGER DEFAULT 5000,
  max_reconnect_attempts INTEGER DEFAULT 10,
  
  -- 건강 체크
  health_check_interval_ms INTEGER DEFAULT 30000,
  health_check_path TEXT DEFAULT '/health',
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  FOREIGN KEY (org_id, agent_id) REFERENCES agents(org_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_devices_agent ON soul_physical_devices(org_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON soul_physical_devices(status);

-- ============================================================
-- 4. soul_playbooks — 플레이북 엔진 (DAG 워크플로우)
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  
  -- 정의
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  
  -- 트리거
  trigger_type TEXT NOT NULL CHECK(trigger_type IN (
    'manual', 'schedule', 'webhook', 'event', 'sensor', 'message'
  )),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  -- schedule: { "cron": "0 9 * * MON" }
  -- webhook: { "endpoint_path": "/hooks/daily-report" }
  -- event: { "event_type": "task.completed", "filter": {...} }
  -- sensor: { "device_id": "...", "metric": "temperature", "threshold": 30 }
  -- message: { "keywords": ["보고서", "report"], "from": "human" }
  
  -- DAG 스텝 (JSON 배열)
  steps JSONB NOT NULL DEFAULT '[]',
  -- [
  --   { "id": "step_1", "type": "llm_call", "config": {...}, "next": ["step_2"] },
  --   { "id": "step_2", "type": "api_call", "config": {...}, "next": ["step_3", "step_4"] },
  --   { "id": "step_3", "type": "condition", "config": {"if": "..."}, "next_true": "step_5", "next_false": "step_6" },
  --   ...
  -- ]
  
  -- 스텝 타입: llm_call, api_call, webhook_send, condition, delay, 
  --           human_approval, physical_command, data_transform, notification
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,  -- 마켓플레이스 공유용
  
  -- 통계
  total_runs INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  FOREIGN KEY (org_id, agent_id) REFERENCES agents(org_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playbooks_agent ON soul_playbooks(org_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_trigger ON soul_playbooks(trigger_type);

-- ============================================================
-- 5. playbook_executions — 플레이북 실행 로그
-- ============================================================

CREATE TABLE IF NOT EXISTS playbook_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES soul_playbooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- 상태 머신
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
    'pending', 'running', 'paused', 'waiting_approval', 'completed', 'failed', 'cancelled'
  )),
  
  -- 실행 정보
  trigger_data JSONB DEFAULT '{}',      -- 트리거 입력 데이터
  current_step_id TEXT,
  step_results JSONB DEFAULT '{}',      -- { "step_1": { "output": ..., "duration_ms": 120 } }
  
  -- 타이밍
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- 에러
  error_step_id TEXT,
  error_message TEXT,
  error_details JSONB,
  
  -- 리트라이
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_executions_playbook ON playbook_executions(playbook_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON playbook_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created ON playbook_executions(created_at DESC);

-- ============================================================
-- 6. soul_data_pipelines — 데이터 파이프라인
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_data_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  
  -- 파이프라인 정의
  name TEXT NOT NULL,
  pipeline_type TEXT NOT NULL CHECK(pipeline_type IN ('realtime', 'batch', 'hybrid')),
  
  -- 소스 (데이터 입력)
  source_type TEXT NOT NULL CHECK(source_type IN (
    'webhook', 'mqtt', 'api_poll', 'database', 'sensor', 'file', 'stream'
  )),
  source_config JSONB NOT NULL DEFAULT '{}',
  
  -- 변환 (데이터 처리)
  transforms JSONB DEFAULT '[]',
  -- [
  --   { "type": "filter", "config": { "field": "temperature", "op": ">", "value": 30 } },
  --   { "type": "aggregate", "config": { "window": "5m", "fn": "avg", "field": "temperature" } },
  --   { "type": "enrich", "config": { "lookup": "device_metadata" } },
  --   { "type": "anomaly_detect", "config": { "method": "zscore", "threshold": 2.5 } }
  -- ]
  
  -- 싱크 (데이터 출력)
  sink_type TEXT NOT NULL CHECK(sink_type IN (
    'database', 'webhook', 'notification', 'dashboard', 'llm_analysis', 'file'
  )),
  sink_config JSONB NOT NULL DEFAULT '{}',
  
  -- 스케줄 (batch)
  schedule_cron TEXT,                -- batch: "*/5 * * * *"
  
  -- 이상 탐지 룰
  alert_rules JSONB DEFAULT '[]',
  -- [
  --   { "name": "high_temp", "condition": "temperature > 35", "action": "notify", "severity": "critical" },
  --   { "name": "low_battery", "condition": "battery < 20", "action": "playbook", "playbook_id": "..." }
  -- ]
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  total_records_processed BIGINT DEFAULT 0,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  FOREIGN KEY (org_id, agent_id) REFERENCES agents(org_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pipelines_agent ON soul_data_pipelines(org_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_type ON soul_data_pipelines(pipeline_type);

-- ============================================================
-- 7. soul_events — 이벤트 버스 (내부 이벤트 라우팅)
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- 이벤트
  event_type TEXT NOT NULL,
  -- 'message.received', 'message.sent', 'task.created', 'task.completed',
  -- 'sensor.data', 'sensor.alert', 'webhook.received', 'playbook.triggered',
  -- 'device.online', 'device.offline', 'integration.sync', 'pipeline.output'
  
  source_type TEXT NOT NULL CHECK(source_type IN (
    'soul', 'device', 'webhook', 'pipeline', 'playbook', 'system', 'human'
  )),
  source_id TEXT NOT NULL,
  
  -- 대상
  target_type TEXT CHECK(target_type IN ('soul', 'device', 'webhook', 'pipeline', 'playbook', 'broadcast')),
  target_id TEXT,
  
  -- 페이로드
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- 상태
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'delivered', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_org ON soul_events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON soul_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_source ON soul_events(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON soul_events(created_at DESC);

-- 파티셔닝 힌트: 프로덕션에서 created_at 기준 월별 파티셔닝 권장
-- soul_events는 고빈도 INSERT → 30일 이상 데이터는 아카이브

-- ============================================================
-- 8. RLS 정책
-- ============================================================

ALTER TABLE soul_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_physical_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_data_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_events ENABLE ROW LEVEL SECURITY;

-- 테넌트 격리: 자기 org 데이터만 접근
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'soul_webhooks', 'soul_integrations', 'soul_physical_devices',
    'soul_playbooks', 'soul_data_pipelines', 'soul_events'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_read ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_tenant_read ON %I FOR SELECT USING (org_id IN (SELECT get_user_org_ids()))', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_write ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_tenant_write ON %I FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids()))', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_update ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_tenant_update ON %I FOR UPDATE USING (org_id IN (SELECT get_user_org_ids()))', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_delete ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_tenant_delete ON %I FOR DELETE USING (org_id IN (SELECT get_user_org_ids()))', tbl, tbl);
    
    -- 슈퍼어드민 전체 접근
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_admin_all ON %I FOR ALL USING (is_super_admin())', tbl, tbl);
  END LOOP;
END $$;

-- playbook_executions (playbook_id 경유)
DROP POLICY IF EXISTS executions_tenant_read ON playbook_executions;
CREATE POLICY executions_tenant_read ON playbook_executions
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS executions_admin_all ON playbook_executions;
CREATE POLICY executions_admin_all ON playbook_executions
  FOR ALL USING (is_super_admin());

-- ============================================================
-- DONE. Kevin SQL Editor에서 실행
-- 의존: 006_admin_rbac.sql 먼저 실행 필요
-- ============================================================
