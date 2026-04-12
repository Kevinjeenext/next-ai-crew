-- 008_org_goals_budget_tasks.sql — 조직도 + 목표 정렬 + 예산 관리 + 태스크/티켓
-- Next AI Crew | CTO Soojin | 2026-04-13
-- Kevin 지시: Paperclip.ing 참고, 글로벌 서비스 기초
--
-- 의존: 005_souls_v2.sql (agents), 006_admin_rbac.sql (profiles)
-- 실행: Supabase SQL Editor

-- ============================================================
-- 1. soul_org_chart — 조직도 (계층 구조)
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_org_chart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  
  -- 계층
  parent_agent_id TEXT,               -- NULL = CEO/최상위
  reporting_to TEXT,                  -- 보고 대상 agent_id (= parent)
  
  -- 역할/직함
  title TEXT NOT NULL,                -- 'CEO', 'CTO', 'Senior Engineer', ...
  department TEXT,                    -- 'engineering', 'marketing', 'design', ...
  level INTEGER NOT NULL DEFAULT 0,   -- 0=C-level, 1=VP, 2=Director, 3=Manager, 4=IC
  
  -- 직급 체계
  rank TEXT DEFAULT 'ic' CHECK(rank IN (
    'c_level',      -- CEO, CTO, CFO
    'vp',           -- VP Engineering, VP Marketing
    'director',     -- Director of Engineering
    'manager',      -- Engineering Manager
    'lead',         -- Tech Lead, Design Lead
    'senior',       -- Senior Engineer
    'ic',           -- Individual Contributor
    'intern'        -- Intern/Junior
  )),
  
  -- 권한
  can_delegate BOOLEAN DEFAULT false,   -- 하위 Soul에게 작업 위임 가능
  can_approve BOOLEAN DEFAULT false,    -- 작업 승인 권한
  can_hire BOOLEAN DEFAULT false,       -- 하위 Soul 채용 권한
  max_direct_reports INTEGER DEFAULT 5, -- 최대 직속 부하 수
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  hired_at TIMESTAMPTZ DEFAULT now(),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  FOREIGN KEY (org_id, agent_id) REFERENCES agents(org_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_org_chart_agent ON soul_org_chart(org_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_parent ON soul_org_chart(org_id, parent_agent_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_dept ON soul_org_chart(org_id, department);

-- 고유 제약: 한 org 내에서 agent는 하나의 position만
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_chart_unique_agent 
  ON soul_org_chart(org_id, agent_id);

-- ============================================================
-- 2. goals — 목표 정렬 (Mission → Project → Agent → Task)
-- ============================================================

-- 2.1 company_goals — 회사 미션 / 프로젝트 목표
CREATE TABLE IF NOT EXISTS company_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- 계층
  parent_id UUID REFERENCES company_goals(id) ON DELETE SET NULL,
  goal_type TEXT NOT NULL CHECK(goal_type IN (
    'mission',      -- 회사 미션 (최상위, org당 1개)
    'objective',    -- OKR Objective
    'key_result',   -- OKR Key Result (측정 가능)
    'project',      -- 프로젝트 목표
    'milestone'     -- 마일스톤
  )),
  
  -- 내용
  title TEXT NOT NULL,
  description TEXT,
  
  -- 측정 (key_result, milestone)
  metric_type TEXT CHECK(metric_type IN ('number', 'percentage', 'currency', 'boolean')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,                          -- 'users', 'MRR', '%', ...
  
  -- 기간
  start_date DATE,
  due_date DATE,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN (
    'draft', 'active', 'on_track', 'at_risk', 'behind', 'completed', 'cancelled'
  )),
  progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
  
  -- 담당
  owner_agent_id TEXT,                -- 목표 책임 Soul
  
  -- 정렬 & 표시
  sort_order INTEGER DEFAULT 0,
  color TEXT DEFAULT '#2563EB',
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_org ON company_goals(org_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON company_goals(parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_type ON company_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_status ON company_goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_owner ON company_goals(owner_agent_id);

-- 2.2 agent_goals — Soul별 목표 (company_goal에서 파생)
CREATE TABLE IF NOT EXISTS agent_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  company_goal_id UUID REFERENCES company_goals(id) ON DELETE SET NULL,
  
  -- 내용
  title TEXT NOT NULL,
  description TEXT,
  
  -- 측정
  metric_type TEXT CHECK(metric_type IN ('number', 'percentage', 'currency', 'boolean')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  
  -- 기간
  due_date DATE,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN (
    'active', 'on_track', 'at_risk', 'completed', 'cancelled'
  )),
  progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  FOREIGN KEY (org_id, agent_id) REFERENCES agents(org_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_goals_agent ON agent_goals(org_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_goals_company ON agent_goals(company_goal_id);

-- ============================================================
-- 3. soul_budgets — 예산 관리 (토큰/비용)
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  
  -- 기간
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK(period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- 예산 한도
  token_limit BIGINT NOT NULL DEFAULT 1000000,       -- 토큰 한도
  cost_limit_cents INTEGER NOT NULL DEFAULT 6000,     -- 비용 한도 (센트, $60 = 6000)
  
  -- 현재 사용량
  tokens_used BIGINT DEFAULT 0,
  cost_used_cents INTEGER DEFAULT 0,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN (
    'active',           -- 정상
    'warning',          -- 80% 도달
    'limit_reached',    -- 100% 도달, 자동 일시정지
    'override'          -- 관리자 오버라이드 (한도 무시)
  )),
  
  -- 자동 제어
  auto_pause_at_limit BOOLEAN DEFAULT true,    -- 100%에서 자동 일시정지
  warning_threshold INTEGER DEFAULT 80,         -- 경고 임계값 (%)
  
  -- 알림 기록
  warning_sent_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  FOREIGN KEY (org_id, agent_id) REFERENCES agents(org_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budgets_agent ON soul_budgets(org_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON soul_budgets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON soul_budgets(status);

-- 고유: agent당 기간당 1개 예산
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_unique 
  ON soul_budgets(org_id, agent_id, period_start);

-- ============================================================
-- 4. tickets — 태스크/티켓 시스템
-- ============================================================

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- 번호 (조직 내 순번)
  ticket_number SERIAL,
  
  -- 연결
  company_goal_id UUID REFERENCES company_goals(id) ON DELETE SET NULL,
  agent_goal_id UUID REFERENCES agent_goals(id) ON DELETE SET NULL,
  parent_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,   -- 서브태스크
  
  -- 내용
  title TEXT NOT NULL,
  description TEXT,
  
  -- 분류
  ticket_type TEXT NOT NULL DEFAULT 'task' CHECK(ticket_type IN (
    'task',           -- 일반 작업
    'bug',            -- 버그 수정
    'feature',        -- 기능 개발
    'review',         -- 리뷰 요청
    'approval',       -- 승인 요청
    'delegation',     -- 위임된 작업
    'cross_team'      -- 타 팀 요청
  )),
  
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN (
    'critical', 'high', 'medium', 'low'
  )),
  
  -- 담당
  creator_type TEXT NOT NULL DEFAULT 'human' CHECK(creator_type IN ('human', 'soul')),
  creator_id TEXT NOT NULL,
  assignee_agent_id TEXT,             -- 담당 Soul
  reviewer_agent_id TEXT,             -- 리뷰어 Soul
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN (
    'open',           -- 생성됨
    'assigned',       -- 배정됨
    'in_progress',    -- 진행 중
    'in_review',      -- 리뷰 중
    'blocked',        -- 차단됨
    'waiting',        -- 외부 대기
    'done',           -- 완료
    'cancelled'       -- 취소
  )),
  
  -- 기간
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- 추적
  estimated_tokens INTEGER,           -- 예상 토큰 사용량
  actual_tokens INTEGER DEFAULT 0,    -- 실제 토큰 사용량
  estimated_minutes INTEGER,          -- 예상 소요 시간
  actual_minutes INTEGER DEFAULT 0,
  
  -- 태그
  labels TEXT[] DEFAULT '{}',
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(org_id, assignee_agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_goal ON tickets(company_goal_id);
CREATE INDEX IF NOT EXISTS idx_tickets_parent ON tickets(parent_ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);

-- 4.2 ticket_comments — 티켓 대화/활동
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- 작성자
  author_type TEXT NOT NULL CHECK(author_type IN ('human', 'soul', 'system')),
  author_id TEXT NOT NULL,
  
  -- 내용
  comment_type TEXT NOT NULL DEFAULT 'message' CHECK(comment_type IN (
    'message',        -- 일반 메시지
    'status_change',  -- 상태 변경
    'assignment',     -- 배정 변경
    'tool_call',      -- 도구 호출 기록
    'decision',       -- 결정 기록
    'approval',       -- 승인/거부
    'system'          -- 시스템 메시지
  )),
  
  content TEXT NOT NULL,
  
  -- 도구 호출 추적
  tool_calls JSONB,                   -- [{ tool: "...", input: {...}, output: {...}, duration_ms: ... }]
  
  -- 추가
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON ticket_comments(created_at DESC);

-- 4.3 ticket_audit_log — 티켓 변경 감사 로그 (immutable)
CREATE TABLE IF NOT EXISTS ticket_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  actor_type TEXT NOT NULL CHECK(actor_type IN ('human', 'soul', 'system')),
  actor_id TEXT NOT NULL,
  
  action TEXT NOT NULL,               -- 'created', 'status_changed', 'assigned', 'priority_changed', ...
  field_changed TEXT,                 -- 'status', 'assignee', 'priority', ...
  old_value TEXT,
  new_value TEXT,
  
  details JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_audit_ticket ON ticket_audit_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_audit_created ON ticket_audit_log(created_at DESC);

-- ============================================================
-- 5. budget_transactions — 예산 거래 내역 (토큰 사용 추적)
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES soul_budgets(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  
  -- 사용 내역
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  
  -- 토큰
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  
  -- 비용 (센트)
  cost_cents INTEGER DEFAULT 0,
  
  -- 모델
  model TEXT,
  provider TEXT,
  
  -- 설명
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_tx_budget ON budget_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_tx_agent ON budget_transactions(org_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_budget_tx_ticket ON budget_transactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_budget_tx_created ON budget_transactions(created_at DESC);

-- ============================================================
-- 6. RLS 정책
-- ============================================================

ALTER TABLE soul_org_chart ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;

-- 테넌트 격리 + 슈퍼어드민 전체 접근
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'soul_org_chart', 'company_goals', 'agent_goals', 'soul_budgets',
    'tickets', 'ticket_comments', 'ticket_audit_log', 'budget_transactions'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_select ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_tenant_select ON %I FOR SELECT USING (org_id IN (SELECT get_user_org_ids()))', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_insert ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_tenant_insert ON %I FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids()))', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_update ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_tenant_update ON %I FOR UPDATE USING (org_id IN (SELECT get_user_org_ids()))', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_delete ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_tenant_delete ON %I FOR DELETE USING (org_id IN (SELECT get_user_org_ids()))', tbl, tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_admin_all ON %I FOR ALL USING (is_super_admin())', tbl, tbl);
  END LOOP;
END $$;

-- ticket_audit_log: INSERT only (immutable)
DROP POLICY IF EXISTS ticket_audit_log_no_update ON ticket_audit_log;
-- (UPDATE/DELETE는 위 루프에서 생성됐지만, 실무에서는 서버 사이드에서 INSERT만 허용 권장)

-- ============================================================
-- 7. Helper Functions — 예산 자동 제어
-- ============================================================

-- 예산 사용률 계산
CREATE OR REPLACE FUNCTION get_budget_usage_pct(p_budget_id UUID)
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT CASE 
    WHEN token_limit = 0 THEN 0
    ELSE LEAST(100, (tokens_used * 100 / token_limit)::INTEGER)
  END
  FROM soul_budgets WHERE id = p_budget_id
$$;

-- 예산 경고/일시정지 체크 (토큰 사용 후 호출)
CREATE OR REPLACE FUNCTION check_budget_after_usage(p_budget_id UUID)
RETURNS soul_budgets
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  budget soul_budgets;
  usage_pct INTEGER;
BEGIN
  SELECT * INTO budget FROM soul_budgets WHERE id = p_budget_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  
  usage_pct := CASE 
    WHEN budget.token_limit = 0 THEN 0
    ELSE LEAST(100, (budget.tokens_used * 100 / budget.token_limit)::INTEGER)
  END;
  
  -- 100% → 자동 일시정지
  IF usage_pct >= 100 AND budget.auto_pause_at_limit AND budget.status != 'limit_reached' THEN
    UPDATE soul_budgets SET 
      status = 'limit_reached', 
      paused_at = now(),
      updated_at = now()
    WHERE id = p_budget_id;
    budget.status := 'limit_reached';
    
  -- 80% → 경고
  ELSIF usage_pct >= budget.warning_threshold AND budget.status = 'active' THEN
    UPDATE soul_budgets SET 
      status = 'warning',
      warning_sent_at = now(),
      updated_at = now()
    WHERE id = p_budget_id;
    budget.status := 'warning';
  END IF;
  
  RETURN budget;
END;
$$;

-- ============================================================
-- DONE. Kevin SQL Editor에서 실행
-- 의존: 005_souls_v2.sql, 006_admin_rbac.sql
-- ============================================================
