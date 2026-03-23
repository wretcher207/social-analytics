-- =============================================================================
-- TERP — Goals & Tolerance Tracking
-- =============================================================================

-- ── goals ─────────────────────────────────────────────────────────────────────
-- Two goal types:
--   'frequency'       — max sessions per week (ongoing)
--   'tolerance_break' — abstain for N days (has an end date)
create table goals (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,

  type            text not null check (type in ('frequency', 'tolerance_break')),
  title           text not null,

  -- frequency goals
  max_per_week    smallint check (max_per_week >= 1),

  -- tolerance-break goals
  duration_days   int check (duration_days >= 1),
  ends_at         timestamptz,

  started_at      timestamptz not null default now(),
  completed       boolean not null default false,
  notes           text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index goals_user_id_idx on goals(user_id, created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table goals enable row level security;

create policy "Users manage own goals"
  on goals for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────
create trigger goals_updated_at
  before update on goals
  for each row execute procedure set_updated_at();
