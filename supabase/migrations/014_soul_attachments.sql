-- 014_soul_attachments.sql — Soul 파일 첨부 시스템
-- Mingu (Backend Developer) | 2026-04-17
-- Taeyoung feat/soul-chat-attachments 브랜치 연동

-- 1. soul_messages에 attachments JSONB 컬럼 추가
-- 형식: [{"url":"...","name":"file.pdf","type":"application/pdf","size":12345,"path":"org/soul/file.pdf"}]
ALTER TABLE soul_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 2. Supabase Storage 버킷은 대시보드에서 생성 필요:
-- 버킷명: soul-attachments
-- Public: false (signed URL 사용, 24h expiry)
-- File size limit: 없음 (Kevin directive)
-- Allowed MIME types: 제한 없음

-- 3. Storage RLS (버킷 생성 후 적용)
-- INSERT: 인증된 사용자만 업로드
-- SELECT: public (getPublicUrl이므로)
-- DELETE: 같은 org의 admin만

-- Note: 스토리지 정책은 Supabase Dashboard에서 설정
-- SQL로는 storage.objects에 직접 정책 추가 가능하나,
-- 버킷이 public이면 SELECT 정책 불필요
