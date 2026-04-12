-- 006_admin_rbac.sql — 백오피스 + 멀티테넌트 + 권한 체계
-- Next AI Crew | CTO Soojin | 2026-04-12
-- Kevin 지시: 슈퍼어드민 + 백오피스 + 테넌트 관리
-- 
-- 기존 스키마와의 관계:
--   organizations = tenant (기존 테이블 재활용)
--   org_members = tenant_members (기존 테이블 확장)
--   profiles = 새로 추가 (auth.users 확장)
--
-- 실행 순서: 이 파일 한 번에 실행

-- ============================================================
-- 1. profiles 테이블 — auth.users 확장
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- 시스템 레벨 역할 (테넌트와 무관)
  system_role TEXT NOT NULL DEFAULT 'user' 
    CHECK(system_role IN ('super_admin', 'admin', 'user')),
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  last_sign_in_at TIMESTAMPTZ,
  
  -- 메타데이터
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 기존 유저 → profiles 마이그레이션 (이미 가입한 유저용)
INSERT INTO profiles (id, email, full_name, system_role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  CASE 
    WHEN email = 'kevin@nextpay.co.kr' THEN 'super_admin'
    ELSE 'user'
  END
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  system_role = CASE 
    WHEN EXCLUDED.email = 'kevin@nextpay.co.kr' THEN 'super_admin'
    ELSE profiles.system_role
  END;

-- ============================================================
-- 2. handle_new_user() 트리거 업데이트
-- profiles에도 자동 생성 + 테넌트(org) 자동 생성
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  user_system_role TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- 슈퍼어드민 시드
  IF NEW.email = 'kevin@nextpay.co.kr' THEN
    user_system_role := 'super_admin';
  ELSE
    user_system_role := 'user';
  END IF;

  -- 1) profiles 생성
  INSERT INTO profiles (id, email, full_name, system_role)
  VALUES (NEW.id, NEW.email, user_name, user_system_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    last_sign_in_at = now();

  -- 2) 테넌트(조직) 자동 생성
  INSERT INTO organizations (name, slug, owner_id)
  VALUES (
    user_name || '''s Team',
    'org-' || substr(NEW.id::text, 1, 8),
    NEW.id
  )
  RETURNING id INTO new_org_id;

  -- 3) 테넌트 멤버 등록 (owner)
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. org_members 역할 확장
-- 기존: owner / admin / member / viewer
-- 유지 — tenant_admin = owner, manager = admin
-- ============================================================

-- organizations에 상태/메타 컬럼 추가
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK(status IN ('active', 'suspended', 'trial', 'expired'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_souls INTEGER DEFAULT 3;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- ============================================================
-- 4. admin_audit_log — 관리자 행동 추적
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);

-- ============================================================
-- 5. system_settings — 글로벌 시스템 설정
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO system_settings (key, value) VALUES
  ('signup_enabled', 'true'::jsonb),
  ('default_plan', '"free"'::jsonb),
  ('default_max_souls', '3'::jsonb),
  ('default_max_members', '5'::jsonb),
  ('maintenance_mode', 'false'::jsonb),
  ('allowed_email_domains', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 6. RLS 정책
-- ============================================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_self_read ON profiles;
CREATE POLICY profiles_self_read ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_self_update ON profiles;
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND system_role = (SELECT system_role FROM profiles WHERE id = auth.uid()));
  -- 자기 system_role은 변경 불가

DROP POLICY IF EXISTS profiles_admin_read ON profiles;
CREATE POLICY profiles_admin_read ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND system_role IN ('super_admin', 'admin'))
  );

-- admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_admin_read ON admin_audit_log;
CREATE POLICY audit_admin_read ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND system_role IN ('super_admin', 'admin'))
  );

DROP POLICY IF EXISTS audit_admin_insert ON admin_audit_log;
CREATE POLICY audit_admin_insert ON admin_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND system_role IN ('super_admin', 'admin'))
  );

-- system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS settings_admin_all ON system_settings;
CREATE POLICY settings_admin_all ON system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND system_role = 'super_admin')
  );

DROP POLICY IF EXISTS settings_read ON system_settings;
CREATE POLICY settings_read ON system_settings
  FOR SELECT USING (true);

-- ============================================================
-- 7. Helper Functions
-- ============================================================

-- 현재 유저의 시스템 역할 조회
CREATE OR REPLACE FUNCTION get_system_role()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT system_role FROM profiles WHERE id = auth.uid()
$$;

-- 슈퍼어드민 체크
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND system_role = 'super_admin')
$$;

-- 관리자 체크 (super_admin + admin)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND system_role IN ('super_admin', 'admin'))
$$;

-- 테넌트 관리자 체크
CREATE OR REPLACE FUNCTION is_tenant_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_id = p_org_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  )
$$;

-- ============================================================
-- DONE. Kevin SQL Editor에서 실행
-- ============================================================
