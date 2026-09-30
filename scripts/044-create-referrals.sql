-- Referral program: admins link Referrer -> Referred Player. Payouts are
-- computed monthly (5% of the referred player's claimed wager-milestone
-- rewards, capped at $200/mo per referred player per platform) and posted
-- as ordinary reward_claims rows (category = 'referral').

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_profile_id uuid not null references public.profiles(id) on delete cascade,
  referred_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  linked_by_admin text,
  notes text,
  created_at timestamptz not null default now(),
  constraint referrals_no_self_referral check (referrer_profile_id <> referred_profile_id)
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_profile_id);

alter table public.referrals enable row level security;

drop policy if exists "Service role all referrals" on public.referrals;
create policy "Service role all referrals" on public.referrals for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Users can view own referrals as referrer" on public.referrals;
create policy "Users can view own referrals as referrer" on public.referrals for select
  using (auth.uid() = referrer_profile_id);

-- Extend reward_claims category constraint to allow the new 'referral' category.
alter table public.reward_claims drop constraint if exists reward_claims_category_check;
alter table public.reward_claims add constraint reward_claims_category_check
  check (category in ('wager_milestone', 'lossback', 'tournament', 'deposit_bonus', 'giveaway', 'raffle', 'leaderboard', 'referral'));
