-- ============================================================
-- 005: Fix organizations.plan DEFAULT value
-- ============================================================
-- Problem: DDL 001 created table with DEFAULT 'free',
-- DDL 004 changed CHECK to exclude 'free' but didn't update DEFAULT.
-- Trigger handle_new_user() inserts without specifying plan → uses DEFAULT → violates CHECK.
-- Fix: set DEFAULT to 'starter' (the new entry-level plan).
-- ============================================================

ALTER TABLE organizations
  ALTER COLUMN plan SET DEFAULT 'starter';

-- Also fix any existing rows stuck on 'free' (shouldn't exist but just in case)
UPDATE organizations SET plan = 'starter' WHERE plan = 'free';
