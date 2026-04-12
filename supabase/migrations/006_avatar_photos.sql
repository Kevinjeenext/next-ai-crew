-- Soul Avatar Photo URLs — Ivy curated (demo/prototype)
-- Actual preset names from DB: alex-developer, maya-designer, etc.
-- ⚠️ 데모 후 generated.photos / 자체 AI 생성 이미지로 교체

UPDATE soul_presets SET thumbnail_url = CASE name
  WHEN 'alex-developer'  THEN 'https://randomuser.me/api/portraits/men/32.jpg'
  WHEN 'maya-designer'   THEN 'https://randomuser.me/api/portraits/women/44.jpg'
  WHEN 'ryan-marketer'   THEN 'https://randomuser.me/api/portraits/men/77.jpg'
  WHEN 'sarah-cs'        THEN 'https://randomuser.me/api/portraits/women/14.jpg'
  WHEN 'daniel-analyst'  THEN 'https://randomuser.me/api/portraits/men/56.jpg'
  WHEN 'yuna-writer'     THEN 'https://randomuser.me/api/portraits/women/65.jpg'
  WHEN 'james-pm'        THEN 'https://randomuser.me/api/portraits/men/35.jpg'
  WHEN 'hana-hr'         THEN 'https://randomuser.me/api/portraits/women/57.jpg'
  WHEN 'leo-finance'     THEN 'https://randomuser.me/api/portraits/men/46.jpg'
  WHEN 'miso-researcher' THEN 'https://randomuser.me/api/portraits/women/79.jpg'
  ELSE thumbnail_url
END
WHERE name IN (
  'alex-developer','maya-designer','ryan-marketer','sarah-cs','daniel-analyst',
  'yuna-writer','james-pm','hana-hr','leo-finance','miso-researcher'
);
