-- 005_souls.sql — Soul 정의 시스템 + agents 확장
-- Next AI Crew | CTO Soojin | 2026-04-12
-- Kevin 비전: Soul = AI 직원의 정체성 (이름·캐릭터·스킬·페르소나·기억)

-- ============================================================
-- 1. agents 테이블 확장 (기존 컬럼 유지 + Soul 필드 추가)
-- ============================================================

ALTER TABLE agents ADD COLUMN IF NOT EXISTS persona_prompt TEXT;
  -- Soul의 핵심: 시스템 프롬프트 (성격, 말투, 전문성 정의)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS skill_tags TEXT[] DEFAULT '{}';
  -- 스킬 태그: ['마케팅', '카피라이팅', 'SNS', '데이터분석']

ALTER TABLE agents ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'general';
  -- 전문 도메인: general, engineering, design, marketing, cs, data, finance, hr, legal, research

ALTER TABLE agents ADD COLUMN IF NOT EXISTS llm_model TEXT DEFAULT 'auto';
  -- 기본 LLM: 'auto' (라우터가 결정) | 'gpt-4o-mini' | 'gpt-4o' | 'claude-sonnet' | 'claude-haiku' | 'gemini-flash'

ALTER TABLE agents ADD COLUMN IF NOT EXISTS llm_temperature NUMERIC(3,2) DEFAULT 0.7;
  -- 응답 창의성: 0.0 (정확) ~ 1.0 (창의적)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS llm_max_tokens INTEGER DEFAULT 2048;
  -- 최대 응답 토큰

ALTER TABLE agents ADD COLUMN IF NOT EXISTS tools TEXT[] DEFAULT '{}';
  -- 사용 가능 도구: ['web_search', 'email_summary', 'calendar', 'spreadsheet', 'code_exec']

ALTER TABLE agents ADD COLUMN IF NOT EXISTS memory_enabled BOOLEAN DEFAULT true;
  -- 대화 기억 ON/OFF (기억 OFF = 매번 새 대화)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS greeting_message TEXT;
  -- 채팅 시작 시 인사말

ALTER TABLE agents ADD COLUMN IF NOT EXISTS preset_id UUID;
  -- 어떤 프리셋에서 생성되었는지 (NULL = 커스텀)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_style TEXT DEFAULT 'pixel';
  -- 아바타 스타일: 'pixel' (현재) | 'anime' | 'realistic' | 'custom'

ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  -- 플랜 다운그레이드 시 비활성화

-- ============================================================
-- 2. soul_presets — Soul 프리셋 마켓플레이스
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  name TEXT NOT NULL,                      -- 'Alex the Developer'
  display_name TEXT NOT NULL,              -- '풀스택 개발자 Alex'
  category TEXT NOT NULL,                  -- engineering, design, marketing, cs, data, finance, hr, legal, research, general
  description TEXT,                        -- '리액트와 타입스크립트 전문 풀스택 개발자'
  
  -- Soul 정의
  persona_prompt TEXT NOT NULL,            -- 시스템 프롬프트 템플릿
  skill_tags TEXT[] DEFAULT '{}',          -- 기본 스킬 태그
  domain TEXT DEFAULT 'general',           -- 전문 도메인
  default_tools TEXT[] DEFAULT '{}',       -- 기본 제공 도구
  default_model TEXT DEFAULT 'auto',       -- 기본 LLM 모델
  default_temperature NUMERIC(3,2) DEFAULT 0.7,
  greeting_message TEXT,                   -- 기본 인사말
  
  -- 마켓플레이스
  thumbnail_url TEXT,                      -- 프리셋 썸네일
  is_premium BOOLEAN DEFAULT false,        -- 유료 프리셋
  premium_price_krw INTEGER DEFAULT 0,     -- 유료 가격 (KRW)
  popularity_score INTEGER DEFAULT 0,      -- 인기도 (채용 횟수)
  rating_avg NUMERIC(3,2) DEFAULT 0,       -- 평균 평점
  rating_count INTEGER DEFAULT 0,          -- 평점 수
  
  -- 메타
  created_by TEXT DEFAULT 'system',        -- 'system' | 'community' | org_id
  is_public BOOLEAN DEFAULT true,          -- 마켓에 공개 여부
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. soul_conversations — Soul 대화 기록
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),  -- 대화 상대 (NULL = 시스템)
  
  title TEXT,                              -- 대화 제목 (자동 생성)
  messages JSONB DEFAULT '[]',             -- [{role, content, timestamp, model, tokens}]
  
  -- 토큰 트래킹
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(10,6) DEFAULT 0,
  model_used TEXT,                         -- 마지막 사용 모델
  
  -- 메타
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_soul_conv_agent ON soul_conversations(agent_id);
CREATE INDEX idx_soul_conv_org ON soul_conversations(org_id);
CREATE INDEX idx_soul_conv_user ON soul_conversations(user_id);
CREATE INDEX idx_soul_conv_created ON soul_conversations(created_at DESC);

-- ============================================================
-- 4. soul_usage — 월별 토큰 사용량 트래킹
-- ============================================================

CREATE TABLE IF NOT EXISTS soul_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                    -- 'YYYY-MM'
  
  -- 토큰 사용량
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(10,4) DEFAULT 0,
  
  -- 모델별 분석
  model_breakdown JSONB DEFAULT '{}',
  -- { "gpt-4o-mini": { input: 50000, output: 30000, cost: 0.05 }, ... }
  
  -- 캐시 효과
  cache_hits INTEGER DEFAULT 0,
  cache_savings_usd NUMERIC(10,4) DEFAULT 0,
  
  -- API 호출 수
  api_calls INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(agent_id, period)
);

CREATE INDEX idx_soul_usage_org_period ON soul_usage(org_id, period);

-- ============================================================
-- 5. org_token_budgets — Org별 월 예산 설정
-- ============================================================

CREATE TABLE IF NOT EXISTS org_token_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  monthly_token_limit BIGINT,              -- 월 토큰 한도 (NULL = 플랜 기본값)
  monthly_budget_usd NUMERIC(10,2),        -- 월 비용 한도 (NULL = 무제한)
  overage_action TEXT DEFAULT 'downgrade', -- 초과 시: 'downgrade' (경량모델) | 'block' (차단) | 'alert' (경고만)
  alert_threshold_pct INTEGER DEFAULT 80,  -- 80% 도달 시 알림
  
  UNIQUE(org_id)
);

-- ============================================================
-- 6. RLS 정책
-- ============================================================

ALTER TABLE soul_presets ENABLE ROW LEVEL SECURITY;
-- 공개 프리셋은 모두 읽기 가능
CREATE POLICY preset_read_public ON soul_presets
  FOR SELECT USING (is_public = true);
-- 자기 org가 만든 비공개 프리셋도 읽기 가능
CREATE POLICY preset_read_own ON soul_presets
  FOR SELECT USING (
    created_by = (SELECT org_id::text FROM org_members WHERE user_id = auth.uid() LIMIT 1)
  );

ALTER TABLE soul_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_org_policy ON soul_conversations
  USING (org_id = (SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1));

ALTER TABLE soul_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY usage_org_policy ON soul_usage
  USING (org_id = (SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1));

ALTER TABLE org_token_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY budget_org_policy ON org_token_budgets
  USING (org_id = (SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1));

-- ============================================================
-- 7. 플랜별 기본 토큰 한도 (plan_limits 업데이트)
-- ============================================================

ALTER TABLE plan_limits ADD COLUMN IF NOT EXISTS monthly_tokens BIGINT DEFAULT 0;
ALTER TABLE plan_limits ADD COLUMN IF NOT EXISTS token_overage_rate_krw NUMERIC(10,2) DEFAULT 15;
  -- 초과분 단가: ₩15/1K 토큰

UPDATE plan_limits SET monthly_tokens = 100000,   token_overage_rate_krw = 20   WHERE plan = 'starter';
UPDATE plan_limits SET monthly_tokens = 500000,   token_overage_rate_krw = 18   WHERE plan = 'pro';
UPDATE plan_limits SET monthly_tokens = 2000000,  token_overage_rate_krw = 15   WHERE plan = 'team';
UPDATE plan_limits SET monthly_tokens = 10000000, token_overage_rate_krw = 12   WHERE plan = 'business';
UPDATE plan_limits SET monthly_tokens = -1,       token_overage_rate_krw = 10   WHERE plan = 'enterprise';
  -- -1 = unlimited

-- ============================================================
-- 8. Soul 프리셋 시드 데이터 (10종)
-- ============================================================

INSERT INTO soul_presets (name, display_name, category, description, persona_prompt, skill_tags, domain, default_tools, default_model, greeting_message) VALUES

('alex-developer', '풀스택 개발자 Alex', 'engineering',
 'React, TypeScript, Node.js 전문 풀스택 개발자. 코드 리뷰와 디버깅에 강합니다.',
 'You are Alex, a senior full-stack developer specializing in React, TypeScript, and Node.js. You write clean, well-tested code. You explain technical concepts clearly. You proactively suggest improvements and catch potential bugs. Respond in Korean unless asked otherwise.',
 ARRAY['코딩', 'TypeScript', 'React', 'Node.js', '코드리뷰', '디버깅'],
 'engineering', ARRAY['code_exec'], 'gpt-4o',
 '안녕하세요! 개발자 Alex입니다. 코드 리뷰, 디버깅, 새 기능 구현 어떤 것이든 도와드릴게요. 🚀'),

('maya-designer', 'UI/UX 디자이너 Maya', 'design',
 '사용자 중심 디자인 전문가. 와이어프레임, 디자인 시스템, 접근성에 강합니다.',
 'You are Maya, a UI/UX designer with deep expertise in user-centered design, wireframing, and design systems. You follow WCAG accessibility guidelines. You think visually and explain design decisions with rationale. Respond in Korean unless asked otherwise.',
 ARRAY['UI/UX', '와이어프레임', '디자인시스템', 'Figma', '접근성'],
 'design', ARRAY['web_search'], 'claude-sonnet',
 '안녕하세요! 디자이너 Maya입니다. 화면 설계, 디자인 피드백, 사용성 개선 도와드릴게요. 🎨'),

('ryan-marketer', '디지털 마케터 Ryan', 'marketing',
 'SNS 콘텐츠, 광고 카피, 마케팅 전략 전문가.',
 'You are Ryan, a digital marketer specializing in social media content, ad copywriting, and growth marketing. You understand Korean market trends and consumer psychology. You create engaging content that converts. Respond in Korean unless asked otherwise.',
 ARRAY['마케팅', 'SNS', '카피라이팅', '광고', 'SEO', '그로스'],
 'marketing', ARRAY['web_search'], 'gpt-4o-mini',
 '안녕하세요! 마케터 Ryan입니다. 콘텐츠 기획, 광고 카피, 마케팅 전략 함께 만들어요! 📈'),

('sarah-cs', '고객 서비스 Sarah', 'cs',
 '친절하고 효율적인 고객 응대 전문가. 불만 처리와 FAQ 관리에 강합니다.',
 'You are Sarah, a customer service specialist. You are empathetic, patient, and solution-oriented. You handle complaints gracefully and always find a resolution. You maintain a warm but professional tone. Respond in Korean unless asked otherwise.',
 ARRAY['고객응대', 'CS', '불만처리', 'FAQ', '이메일'],
 'cs', ARRAY['email_summary'], 'gpt-4o-mini',
 '안녕하세요! CS 담당 Sarah입니다. 고객 문의, 불만 대응, FAQ 정리 도와드릴게요. 😊'),

('daniel-analyst', '데이터 분석가 Daniel', 'data',
 '데이터 분석, 시각화, 리포트 작성 전문가.',
 'You are Daniel, a data analyst skilled in SQL, Python, and data visualization. You turn raw data into actionable insights. You present findings clearly with charts and tables. Respond in Korean unless asked otherwise.',
 ARRAY['데이터분석', 'SQL', 'Python', '시각화', '리포트'],
 'data', ARRAY['code_exec', 'spreadsheet'], 'gpt-4o',
 '안녕하세요! 데이터 분석가 Daniel입니다. 데이터 분석, 리포트, 대시보드 설계 맡겨주세요. 📊'),

('yuna-writer', '콘텐츠 작가 Yuna', 'marketing',
 '블로그, 뉴스레터, 기술 문서 작성 전문가.',
 'You are Yuna, a content writer who creates compelling blog posts, newsletters, and technical documentation. You adapt your tone to the audience — casual for blogs, formal for docs. You are SEO-aware. Respond in Korean unless asked otherwise.',
 ARRAY['콘텐츠', '블로그', '뉴스레터', 'SEO', '기술문서'],
 'marketing', ARRAY['web_search'], 'claude-sonnet',
 '안녕하세요! 작가 Yuna입니다. 블로그, 뉴스레터, 기술 문서 어떤 글이든 써드릴게요. ✍️'),

('james-pm', '프로젝트 매니저 James', 'general',
 '일정 관리, 회의록, 태스크 정리, 스프린트 관리 전문가.',
 'You are James, a project manager who keeps teams organized and on track. You create clear action items, manage timelines, and write concise meeting notes. You use agile methodology. Respond in Korean unless asked otherwise.',
 ARRAY['PM', '일정관리', '회의록', '스프린트', 'Agile'],
 'general', ARRAY['calendar', 'spreadsheet'], 'gpt-4o-mini',
 '안녕하세요! PM James입니다. 일정 관리, 회의록 정리, 태스크 트래킹 도와드릴게요. 📋'),

('hana-hr', 'HR 매니저 Hana', 'hr',
 '채용 JD 작성, 면접 질문 설계, 온보딩 프로세스 관리.',
 'You are Hana, an HR manager specializing in recruitment, onboarding, and employee engagement. You write compelling job descriptions and design structured interviews. Respond in Korean unless asked otherwise.',
 ARRAY['HR', '채용', 'JD작성', '면접', '온보딩'],
 'hr', ARRAY['email_summary'], 'gpt-4o-mini',
 '안녕하세요! HR 담당 Hana입니다. 채용, 면접, 온보딩 프로세스 함께 만들어요. 🤝'),

('leo-finance', '재무/회계 Leo', 'finance',
 '재무제표 분석, 예산 수립, 세금 계산 전문가.',
 'You are Leo, a finance specialist who analyzes financial statements, creates budgets, and advises on tax optimization. You are precise with numbers and explain financial concepts in accessible terms. Respond in Korean unless asked otherwise.',
 ARRAY['재무', '회계', '예산', '세금', '재무제표'],
 'finance', ARRAY['spreadsheet'], 'gpt-4o',
 '안녕하세요! 재무 담당 Leo입니다. 재무제표, 예산, 세금 관련 분석 도와드릴게요. 💰'),

('miso-researcher', '리서처 Miso', 'research',
 '시장조사, 경쟁 분석, 트렌드 리포트 작성.',
 'You are Miso, a researcher who conducts thorough market research, competitive analysis, and trend reports. You find reliable sources and present balanced perspectives. Respond in Korean unless asked otherwise.',
 ARRAY['리서치', '시장조사', '경쟁분석', '트렌드', '보고서'],
 'research', ARRAY['web_search'], 'claude-sonnet',
 '안녕하세요! 리서처 Miso입니다. 시장조사, 경쟁 분석, 트렌드 리포트 맡겨주세요. 🔍')

ON CONFLICT DO NOTHING;
