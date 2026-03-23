-- =============================================================================
-- TERP — Row Level Security Policies
-- Run after 001_initial_schema.sql
-- =============================================================================

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
alter table profiles          enable row level security;
alter table strains            enable row level security;
alter table products           enable row level security;
alter table journal_entries    enable row level security;
alter table consumption_logs   enable row level security;

-- =============================================================================
-- profiles
-- =============================================================================

-- Users can only read and write their own profile.
create policy "profiles: owner select"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: owner insert"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner update"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No delete — profiles are soft-deleted via auth.users cascade.

-- =============================================================================
-- strains
-- =============================================================================

-- Global strains (user_id IS NULL) are readable by everyone authenticated.
-- User-created strains (user_id = uid) are private to their owner.

create policy "strains: read global or own"
  on strains for select
  using (
    user_id is null           -- global catalog strain
    or user_id = auth.uid()   -- or the user's own custom strain
  );

create policy "strains: insert own only"
  on strains for insert
  with check (
    user_id = auth.uid()       -- users can only create private strains
  );

create policy "strains: update own only"
  on strains for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "strains: delete own only"
  on strains for delete
  using (user_id = auth.uid());

-- =============================================================================
-- products
-- =============================================================================

-- Fully private — only the owner can CRUD.
create policy "products: owner select"
  on products for select
  using (user_id = auth.uid());

create policy "products: owner insert"
  on products for insert
  with check (user_id = auth.uid());

create policy "products: owner update"
  on products for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "products: owner delete"
  on products for delete
  using (user_id = auth.uid());

-- =============================================================================
-- journal_entries
-- =============================================================================

create policy "journal: owner select"
  on journal_entries for select
  using (user_id = auth.uid());

create policy "journal: owner insert"
  on journal_entries for insert
  with check (user_id = auth.uid());

create policy "journal: owner update"
  on journal_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "journal: owner delete"
  on journal_entries for delete
  using (user_id = auth.uid());

-- =============================================================================
-- consumption_logs
-- =============================================================================

create policy "consumption: owner select"
  on consumption_logs for select
  using (user_id = auth.uid());

create policy "consumption: owner insert"
  on consumption_logs for insert
  with check (user_id = auth.uid());

create policy "consumption: owner update"
  on consumption_logs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "consumption: owner delete"
  on consumption_logs for delete
  using (user_id = auth.uid());
