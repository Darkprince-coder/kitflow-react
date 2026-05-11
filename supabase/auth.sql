-- ============================================================
--  KitFlow — Auth Setup
--  Run AFTER schema.sql and functions.sql.
--
--  Supabase handles auth.users automatically.
--  This file adds helper functions for user management
--  that the admin can call from the SQL editor.
-- ============================================================


-- ── View authenticated users (admin convenience) ─────────────
-- Lists all registered staff accounts.
-- Run in SQL editor: SELECT * FROM staff_accounts;
create or replace view staff_accounts as
  select
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'role'      as role
  from auth.users
  order by created_at desc;


-- ── Create a staff account ────────────────────────────────────
-- Supabase doesn't allow direct INSERT into auth.users from SQL.
-- Use the Supabase Dashboard → Authentication → Users → Add User,
-- OR use the admin API / Supabase CLI:
--
--   supabase auth users create \
--     --email kitmanager@primesports.ke \
--     --password SecurePassword123 \
--     --user-metadata '{"full_name":"Kit Manager","role":"manager"}'
--
-- OR in your app's admin panel call:
--   supabase.auth.admin.createUser({ email, password, user_metadata })
-- (requires service_role key — never expose on frontend)


-- ── User roles note ───────────────────────────────────────────
-- KitFlow v1 uses a simple model: authenticated = full access.
-- For role-based access (admin vs kit manager vs read-only),
-- store roles in user_metadata and enforce in RLS like:
--
--   create policy "admin_only_delete" on equipment
--     for delete using (
--       auth.role() = 'authenticated' AND
--       (auth.jwt()->'user_metadata'->>'role') = 'admin'
--     );
--
-- This can be added in a future version without schema changes.
