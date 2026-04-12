-- Soul Avatar Photo URLs — Ivy curated (demo/prototype)
-- ⚠️ 데모 후 generated.photos / 자체 AI 생성 이미지로 교체

UPDATE soul_presets SET thumbnail_url = CASE lower(name)
  WHEN 'alex'    THEN 'https://randomuser.me/api/portraits/men/32.jpg'
  WHEN 'sophia'  THEN 'https://randomuser.me/api/portraits/women/44.jpg'
  WHEN 'marcus'  THEN 'https://randomuser.me/api/portraits/men/83.jpg'
  WHEN 'yuna'    THEN 'https://randomuser.me/api/portraits/women/65.jpg'
  WHEN 'liam'    THEN 'https://randomuser.me/api/portraits/men/11.jpg'
  WHEN 'priya'   THEN 'https://randomuser.me/api/portraits/women/79.jpg'
  WHEN 'carlos'  THEN 'https://randomuser.me/api/portraits/men/46.jpg'
  WHEN 'emma'    THEN 'https://randomuser.me/api/portraits/women/14.jpg'
  WHEN 'jin'     THEN 'https://randomuser.me/api/portraits/men/56.jpg'
  WHEN 'amara'   THEN 'https://randomuser.me/api/portraits/women/91.jpg'
  WHEN 'noah'    THEN 'https://randomuser.me/api/portraits/men/23.jpg'
  WHEN 'hana'    THEN 'https://randomuser.me/api/portraits/women/57.jpg'
  WHEN 'diego'   THEN 'https://randomuser.me/api/portraits/men/68.jpg'
  WHEN 'nadia'   THEN 'https://randomuser.me/api/portraits/women/37.jpg'
  WHEN 'ryan'    THEN 'https://randomuser.me/api/portraits/men/77.jpg'
  WHEN 'zoe'     THEN 'https://randomuser.me/api/portraits/women/25.jpg'
  WHEN 'samuel'  THEN 'https://randomuser.me/api/portraits/men/92.jpg'
  WHEN 'mei'     THEN 'https://randomuser.me/api/portraits/women/48.jpg'
  WHEN 'ethan'   THEN 'https://randomuser.me/api/portraits/men/35.jpg'
  WHEN 'isabel'  THEN 'https://randomuser.me/api/portraits/women/62.jpg'
  ELSE thumbnail_url
END
WHERE lower(name) IN (
  'alex','sophia','marcus','yuna','liam','priya','carlos','emma',
  'jin','amara','noah','hana','diego','nadia','ryan','zoe',
  'samuel','mei','ethan','isabel'
);
