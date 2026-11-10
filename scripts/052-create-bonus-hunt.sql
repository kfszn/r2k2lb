-- Bonus Hunt: hunts, entries, known slots (for images) and chat-call settings.
-- Mirrors the create_bonus_hunt migration applied to Supabase.

create table if not exists public.bonus_hunts (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  start_balance numeric(14,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','live','ended')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bonus_hunt_entries (
  id uuid primary key default gen_random_uuid(),
  hunt_id uuid not null references public.bonus_hunts(id) on delete cascade,
  position integer not null,
  game_name text not null,
  game_image_url text,
  bet_size numeric(14,2) not null default 0,
  payout numeric(14,2),
  called_by text,
  status text not null default 'called' check (status in ('called','bought','opened')),
  created_at timestamptz not null default now()
);
create index if not exists bonus_hunt_entries_hunt_position_idx on public.bonus_hunt_entries (hunt_id, position);
create index if not exists bonus_hunt_entries_called_by_idx on public.bonus_hunt_entries (hunt_id, lower(called_by));

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  name_key text not null unique,
  display_name text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bonus_hunt_settings (
  id integer primary key default 1 check (id = 1),
  hunt_on boolean not null default false,
  max_calls_per_user integer not null default 1 check (max_calls_per_user >= 1),
  reject_duplicates boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.bonus_hunt_settings (id) values (1) on conflict (id) do nothing;

-- Accessed only through server routes with the service role key.
alter table public.bonus_hunts enable row level security;
alter table public.bonus_hunt_entries enable row level security;
alter table public.slots enable row level security;
alter table public.bonus_hunt_settings enable row level security;
