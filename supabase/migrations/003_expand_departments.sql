-- ============================================================
-- Expand default departments: 5 → 10 departments
-- Updates handle_new_user() trigger for new signups
-- Kevin directive: diverse AI job roles
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create org
  INSERT INTO organizations (name, slug, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || '''s Team',
    'org-' || substr(NEW.id::text, 1, 8),
    NEW.id
  )
  RETURNING id INTO new_org_id;

  -- Add owner as member
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  -- Seed 10 departments
  INSERT INTO departments (id, org_id, name, name_ko, icon, color, sort_order) VALUES
    ('engineering',       new_org_id, 'Engineering',       '엔지니어링',   '💻', '#2563EB', 1),
    ('design',            new_org_id, 'Design',            '디자인',       '🎨', '#6366F1', 2),
    ('marketing',         new_org_id, 'Marketing',         '마케팅',       '📣', '#06B6D4', 3),
    ('finance',           new_org_id, 'Finance',           '재무',         '💰', '#10B981', 4),
    ('hr',                new_org_id, 'HR',                '인사',         '👥', '#F59E0B', 5),
    ('sales',             new_org_id, 'Sales',             '영업',         '🤝', '#EF4444', 6),
    ('customer-success',  new_org_id, 'Customer Success',  '고객성공',     '💬', '#8B5CF6', 7),
    ('legal',             new_org_id, 'Legal',             '법무',         '⚖️', '#64748B', 8),
    ('planning',          new_org_id, 'Planning',          '기획',         '📐', '#0EA5E9', 9),
    ('operations',        new_org_id, 'Operations',        '운영',         '⚙️', '#F97316', 10);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
