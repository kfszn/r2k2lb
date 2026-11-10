alter table public.kick_bot_tokens
  add column if not exists refresh_lock_until timestamptz,
  add column if not exists last_refresh_at timestamptz,
  add column if not exists last_refresh_error text,
  add column if not exists last_refresh_error_at timestamptz,
  add column if not exists needs_reauth boolean not null default false;
