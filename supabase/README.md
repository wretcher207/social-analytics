# TERP — Supabase Setup

## 1. Create a Supabase project

Go to https://supabase.com → New project.

## 2. Run migrations

In the Supabase dashboard → **SQL Editor → New query**, paste and run each file in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
```

## 3. Seed global strain catalog (optional but recommended)

```
supabase/seed.sql
```

## 4. Grab your credentials

From **Project Settings → API**:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret — server only) |

Copy into:
- `client/.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `server/.env` → `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## 5. Auth settings

In **Authentication → Settings**:
- Enable **Email** provider
- Enable **Magic link** (optional)
- Set **Site URL** to `http://localhost:5173` for dev, your Netlify URL for prod
- Add `http://localhost:5173/**` to **Redirect URLs**

## Schema overview

| Table | RLS | Notes |
|---|---|---|
| `profiles` | Owner only | Auto-created on user signup via trigger |
| `strains` | Global (read) + owner (write) | `user_id = null` → shared catalog |
| `products` | Owner only | Links to strains |
| `journal_entries` | Owner only | Core model, AI fields populated in Phase 3 |
| `consumption_logs` | Owner only | Lightweight session log |
