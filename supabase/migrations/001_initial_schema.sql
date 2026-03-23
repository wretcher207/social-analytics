-- =============================================================================
-- TERP — Initial Schema Migration
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- =============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for trigram fuzzy search on strain names

-- ── Custom Types / Enums ──────────────────────────────────────────────────────
create type cultivar_type as enum (
  'indica', 'sativa', 'hybrid', 'cbd', 'unknown'
);

create type product_category as enum (
  'flower', 'concentrate', 'edible', 'tincture', 'topical', 'vape', 'other'
);

create type concentrate_subcategory as enum (
  'live_resin', 'live_rosin', 'rosin', 'wax', 'shatter', 'badder',
  'sugar', 'diamonds', 'sauce', 'hash', 'distillate', 'rso', 'other'
);

create type consumption_method as enum (
  'flower', 'dab', 'vape', 'edible', 'tincture', 'topical', 'sublingual', 'other'
);

-- ── profiles ──────────────────────────────────────────────────────────────────
-- One row per auth.users entry. Created via trigger on signup.
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  avatar_url      text,
  timezone        text default 'UTC',
  onboarded       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── strains ───────────────────────────────────────────────────────────────────
-- Global strains have user_id = null.
-- User-created strains are private (user_id = their uid).
create table strains (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,  -- null = global

  name            text not null,
  brand           text,
  cultivar_type   cultivar_type not null default 'unknown',

  thc_pct         numeric(5,2) check (thc_pct >= 0 and thc_pct <= 100),
  cbd_pct         numeric(5,2) check (cbd_pct >= 0 and cbd_pct <= 100),

  -- [{"name": "Myrcene", "pct": 0.82}, ...]
  terpenes        jsonb not null default '[]'::jsonb,

  lineage         text,   -- parent strains, freeform
  description     text,
  image_url       text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index strains_user_id_idx  on strains(user_id);
create index strains_name_trgm    on strains using gin(name gin_trgm_ops);

-- ── products ──────────────────────────────────────────────────────────────────
-- A specific jar / cartridge / package the user purchased.
create table products (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  strain_id       uuid references strains(id) on delete set null,

  name            text not null,
  category        product_category not null default 'flower',
  subcategory     concentrate_subcategory,  -- only relevant for concentrates

  brand           text,
  dispensary      text,
  batch_number    text,
  sku             text,

  -- Macros (can overlap with strain; product COA takes precedence)
  thc_pct         numeric(5,2) check (thc_pct >= 0 and thc_pct <= 100),
  cbd_pct         numeric(5,2) check (cbd_pct >= 0 and cbd_pct <= 100),
  terpenes        jsonb not null default '[]'::jsonb,

  weight_g        numeric(7,3) check (weight_g > 0),   -- original weight
  remaining_g     numeric(7,3) check (remaining_g >= 0), -- tracked inventory
  price_paid      numeric(8,2) check (price_paid >= 0),

  image_url       text,
  label_image_url text,  -- photo of the label / COA for OCR intake (Phase 10)

  purchased_at    timestamptz,
  archived        boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index products_user_id_idx  on products(user_id);
create index products_strain_id_idx on products(strain_id);
create index products_category_idx  on products(user_id, category);
create index products_archived_idx  on products(user_id, archived);

-- ── journal_entries ───────────────────────────────────────────────────────────
-- The core model. Each entry is a session with optional structured ratings.
create table journal_entries (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  product_id      uuid references products(id) on delete set null,
  strain_id       uuid references strains(id) on delete set null,

  -- Content
  title           text,
  body            text,  -- raw freeform notes

  -- AI-generated (Phase 3 — populated by Claude)
  ai_summary          text,
  ai_terpene_profile  jsonb,    -- Claude's inferred terpene reasoning
  ai_effects_inferred text[],   -- effects Claude detected from the body text
  ai_processed        boolean not null default false,

  -- Structured ratings (1–5 scale, null = not logged)
  mood_before     smallint check (mood_before between 1 and 5),
  mood_after      smallint check (mood_after between 1 and 5),
  energy_before   smallint check (energy_before between 1 and 5),
  energy_after    smallint check (energy_after between 1 and 5),
  anxiety_before  smallint check (anxiety_before between 1 and 5),
  anxiety_after   smallint check (anxiety_after between 1 and 5),
  pain_before     smallint check (pain_before between 1 and 5),
  pain_after      smallint check (pain_after between 1 and 5),
  focus_before    smallint check (focus_before between 1 and 5),
  focus_after     smallint check (focus_after between 1 and 5),

  overall_rating  smallint check (overall_rating between 1 and 5),

  -- Categorical
  consumption_method  consumption_method,
  dose_mg             numeric(7,2) check (dose_mg > 0),  -- for edibles, tinctures
  dose_description    text,    -- freeform: "two small dabs", "one bowl", etc.
  setting             text,    -- 'home', 'outdoor', 'social', 'medical', etc.

  -- Tags — user-defined labels + AI-suggested effects
  effects     text[] not null default '{}',   -- positive effects observed
  negatives   text[] not null default '{}',   -- adverse effects
  tags        text[] not null default '{}',   -- arbitrary user tags

  -- When the session actually happened (may differ from created_at)
  session_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index journal_user_id_idx       on journal_entries(user_id, session_at desc);
create index journal_product_id_idx    on journal_entries(product_id);
create index journal_strain_id_idx     on journal_entries(strain_id);
create index journal_session_at_idx    on journal_entries(user_id, session_at);
create index journal_effects_gin_idx   on journal_entries using gin(effects);
create index journal_tags_gin_idx      on journal_entries using gin(tags);

-- ── consumption_logs ──────────────────────────────────────────────────────────
-- Lightweight session log. Can exist independently or link to a journal entry.
create table consumption_logs (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  product_id          uuid references products(id) on delete set null,
  journal_entry_id    uuid references journal_entries(id) on delete set null,

  method              consumption_method not null default 'flower',
  dose_mg             numeric(7,2) check (dose_mg > 0),
  dose_description    text,

  started_at          timestamptz not null default now(),
  duration_minutes    smallint check (duration_minutes > 0),

  notes               text,
  created_at          timestamptz not null default now()
);

create index consumption_user_idx       on consumption_logs(user_id, started_at desc);
create index consumption_product_idx    on consumption_logs(product_id);
create index consumption_journal_idx    on consumption_logs(journal_entry_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

create trigger strains_updated_at
  before update on strains
  for each row execute procedure set_updated_at();

create trigger products_updated_at
  before update on products
  for each row execute procedure set_updated_at();

create trigger journal_updated_at
  before update on journal_entries
  for each row execute procedure set_updated_at();
