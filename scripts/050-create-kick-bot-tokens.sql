create table if not exists public.kick_bot_tokens (
  id text primary key default 'bot',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scopes text,
  kick_user_id text,
  kick_username text,
  updated_at timestamptz default now()
);

alter table public.kick_bot_tokens enable row level security;

-- No policies on purpose: only the service role (which bypasses RLS) can read or write tokens.
revoke all on table public.kick_bot_tokens from anon, authenticated;
