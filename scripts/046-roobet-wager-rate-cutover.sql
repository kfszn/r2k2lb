alter table wager_milestone_tiers add column if not exists legacy_reward_amount numeric;
update wager_milestone_tiers set legacy_reward_amount = reward_amount where legacy_reward_amount is null;

create table if not exists wager_milestone_rate_cutovers (
  platform text primary key,
  cutover_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table wager_milestone_rate_cutovers enable row level security;
drop policy if exists "rate cutovers readable" on wager_milestone_rate_cutovers;
create policy "rate cutovers readable" on wager_milestone_rate_cutovers for select using (true);

insert into wager_milestone_rate_cutovers (platform, cutover_at) values ('roobet', now())
on conflict (platform) do nothing;

update wager_milestone_tiers set reward_amount = reward_amount * 1.5 where platform = 'roobet';
