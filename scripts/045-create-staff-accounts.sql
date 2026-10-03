-- Staff accounts: restricted admin logins for employees.
-- Staff can only access the Rewards (create + status updates only, no
-- edit/delete of existing claims) and Users sections of /admin.
-- No RLS policies are defined on purpose — only the service role (used by
-- the admin API routes) can read/write this table; anon/authenticated
-- clients are denied by default once RLS is enabled.
create table if not exists public.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  password_salt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.staff_accounts enable row level security;
