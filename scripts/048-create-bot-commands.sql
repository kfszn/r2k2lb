-- Custom chat commands answered by the Kick webhook (e.g. !socials, !discord).
-- {user} in the response is replaced with the sender's username.
create table if not exists public.bot_commands (
  id uuid primary key default gen_random_uuid(),
  command text not null unique,
  response text not null,
  cooldown_seconds integer not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.bot_commands enable row level security;

drop policy if exists "service_role_all_bot_commands" on public.bot_commands;
create policy "service_role_all_bot_commands" on public.bot_commands
  for all to service_role using (true) with check (true);
