-- Add support for a second, separate raffle type: the "Highest Multi Raffle" (Roobet-only).
-- Existing wager-based raffle rows implicitly become raffle_type = 'wager' via the column default.

alter table raffle_config
  add column if not exists raffle_type text not null default 'wager',
  add column if not exists multiplier_threshold numeric not null default 200,
  add column if not exists min_bet_size numeric not null default 1;

-- Replace the old single-platform uniqueness constraint with one that allows
-- a platform to have both a 'wager' row and a 'multiplier' row.
alter table raffle_config drop constraint if exists raffle_config_platform_key;
drop index if exists raffle_config_platform_key;
alter table raffle_config
  add constraint raffle_config_platform_raffle_type_key unique (platform, raffle_type);

-- Seed the Highest Multi Raffle config for Roobet.
insert into raffle_config (platform, raffle_type, multiplier_threshold, min_bet_size, prize_amount, max_entries, start_date, end_date)
select 'roobet', 'multiplier', 200, 1, 1000, 10000,
  (select start_date from raffle_config where platform = 'roobet' and raffle_type = 'wager' limit 1),
  (select end_date from raffle_config where platform = 'roobet' and raffle_type = 'wager' limit 1)
where not exists (
  select 1 from raffle_config where platform = 'roobet' and raffle_type = 'multiplier'
);

-- Track which raffle a winner belongs to, distinct from the existing free-text
-- raffle_type column (which stores a display label like "Weekly").
alter table raffle_winners
  add column if not exists raffle_category text not null default 'wager';
