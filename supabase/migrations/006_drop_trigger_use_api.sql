-- ============================================================
-- 006: Drop auth trigger — org creation handled by /api/auth/setup
-- ============================================================
-- The handle_new_user() trigger fails because:
--   1. plan DEFAULT was 'free' but CHECK only allows starter/pro/team/business/enterprise
--   2. departments.id conflicts on repeat signups
--   3. Trigger errors surface as "Database error saving new user"
--
-- Solution: Remove trigger entirely. The /api/auth/setup endpoint
-- handles org + department creation reliably with proper error handling.
-- ============================================================

-- 1. Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Fix plan default (in case DDL 005 wasn't run)
ALTER TABLE organizations ALTER COLUMN plan SET DEFAULT 'starter';

-- 4. Fix any orphaned 'free' plans
UPDATE organizations SET plan = 'starter' WHERE plan = 'free';

-- 5. Clean up orphaned auth.users who have no org (failed trigger)
--    These users can simply re-login and /api/auth/setup will create their org.
--    No data loss — they never got past the signup screen.
