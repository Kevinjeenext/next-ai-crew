-- Soul Avatar Photo URLs — Demo/MVP
-- Maps 20 presets to diverse AI-like profile photos
-- Source: randomuser.me (CC-BY, free commercial use)
-- Replace with Generated Photos / custom AI images in production

-- Match by preset name (case-insensitive)
UPDATE soul_presets SET thumbnail_url = CASE lower(name)
  -- 01 Alex (Engineering, M, Caucasian, 30s)
  WHEN 'alex' THEN 'https://randomuser.me/api/portraits/men/32.jpg'
  -- 02 Sophia (Design, F, Asian, 20s)
  WHEN 'sophia' THEN 'https://randomuser.me/api/portraits/women/44.jpg'
  -- 03 Marcus (Security, M, Black, 40s)
  WHEN 'marcus' THEN 'https://randomuser.me/api/portraits/men/83.jpg'
  -- 04 Yuna (PM, F, Korean, 30s)
  WHEN 'yuna' THEN 'https://randomuser.me/api/portraits/women/79.jpg'
  -- 05 Liam (DevOps, M, Caucasian, 20s)
  WHEN 'liam' THEN 'https://randomuser.me/api/portraits/men/18.jpg'
  -- 06 Priya (Data, F, Indian, 30s)
  WHEN 'priya' THEN 'https://randomuser.me/api/portraits/women/67.jpg'
  -- 07 Carlos (Marketing, M, Latin, 30s)
  WHEN 'carlos' THEN 'https://randomuser.me/api/portraits/men/46.jpg'
  -- 08 Emma (QA, F, Caucasian, 20s)
  WHEN 'emma' THEN 'https://randomuser.me/api/portraits/women/21.jpg'
  -- 09 Jin (Backend, M, East Asian, 30s)
  WHEN 'jin' THEN 'https://randomuser.me/api/portraits/men/55.jpg'
  -- 10 Amara (EA, F, Black, 30s)
  WHEN 'amara' THEN 'https://randomuser.me/api/portraits/women/90.jpg'
  -- 11 Noah (Frontend, M, Mixed, 20s)
  WHEN 'noah' THEN 'https://randomuser.me/api/portraits/men/22.jpg'
  -- 12 Hana (UX Research, F, Japanese, 30s)
  WHEN 'hana' THEN 'https://randomuser.me/api/portraits/women/52.jpg'
  -- 13 Diego (Mobile, M, Latin, 30s)
  WHEN 'diego' THEN 'https://randomuser.me/api/portraits/men/67.jpg'
  -- 14 Nadia (Content, F, Middle East, 30s)
  WHEN 'nadia' THEN 'https://randomuser.me/api/portraits/women/33.jpg'
  -- 15 Ryan (Infra, M, Asian, 40s)
  WHEN 'ryan' THEN 'https://randomuser.me/api/portraits/men/71.jpg'
  -- 16 Zoe (Growth, F, Caucasian, 20s)
  WHEN 'zoe' THEN 'https://randomuser.me/api/portraits/women/17.jpg'
  -- 17 Samuel (Data Science, M, Black, 30s)
  WHEN 'samuel' THEN 'https://randomuser.me/api/portraits/men/81.jpg'
  -- 18 Mei (Frontend, F, Chinese, 20s)
  WHEN 'mei' THEN 'https://randomuser.me/api/portraits/women/58.jpg'
  -- 19 Ethan (DevRel, M, Caucasian, 30s)
  WHEN 'ethan' THEN 'https://randomuser.me/api/portraits/men/36.jpg'
  -- 20 Isabel (Ops, F, Latin, 40s)
  WHEN 'isabel' THEN 'https://randomuser.me/api/portraits/women/85.jpg'
  ELSE thumbnail_url
END
WHERE lower(name) IN (
  'alex','sophia','marcus','yuna','liam','priya','carlos','emma',
  'jin','amara','noah','hana','diego','nadia','ryan','zoe',
  'samuel','mei','ethan','isabel'
);
