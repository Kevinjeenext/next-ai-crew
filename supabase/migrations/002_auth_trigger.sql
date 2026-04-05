-- ============================================================
-- Auto-create organization on user signup (DB Trigger)
-- CTO Soojin recommendation: more reliable than API endpoint
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organizations (name, slug, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || '''s Team',
    'org-' || substr(NEW.id::text, 1, 8),
    NEW.id
  );
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (
    (SELECT id FROM organizations WHERE owner_id = NEW.id ORDER BY created_at DESC LIMIT 1),
    NEW.id,
    'owner'
  );
  -- Seed default departments
  INSERT INTO departments (id, org_id, name, name_ko, icon, color, sort_order) VALUES
    ('engineering', (SELECT id FROM organizations WHERE owner_id = NEW.id ORDER BY created_at DESC LIMIT 1), 'Engineering', '엔지니어링', '⚙️', '#3b82f6', 1),
    ('design', (SELECT id FROM organizations WHERE owner_id = NEW.id ORDER BY created_at DESC LIMIT 1), 'Design', '디자인', '🎨', '#8b5cf6', 2),
    ('marketing', (SELECT id FROM organizations WHERE owner_id = NEW.id ORDER BY created_at DESC LIMIT 1), 'Marketing', '마케팅', '📢', '#f59e0b', 3),
    ('planning', (SELECT id FROM organizations WHERE owner_id = NEW.id ORDER BY created_at DESC LIMIT 1), 'Planning', '기획', '📊', '#6366f1', 4),
    ('operations', (SELECT id FROM organizations WHERE owner_id = NEW.id ORDER BY created_at DESC LIMIT 1), 'Operations', '운영', '📋', '#10b981', 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
