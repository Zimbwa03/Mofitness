alter table public.users
  add column if not exists points integer not null default 0,
  add column if not exists push_token text,
  add column if not exists notifications_enabled boolean not null default true;

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source text not null,
  source_ref text,
  points integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_catalog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  points_cost integer not null check (points_cost > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.reward_catalog(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'redeemed' check (status in ('redeemed','fulfilled')),
  redeemed_at timestamptz not null default now()
);

create table if not exists public.achievement_badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  icon_name text not null default 'trophy',
  points_threshold integer,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid not null references public.achievement_badges(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (badge_id, user_id)
);

alter table public.points_ledger enable row level security;
alter table public.reward_catalog enable row level security;
alter table public.user_rewards enable row level security;
alter table public.achievement_badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "users can view own points ledger" on public.points_ledger;
create policy "users can view own points ledger"
  on public.points_ledger for select
  using (auth.uid() = user_id);

drop policy if exists "authenticated read reward catalog" on public.reward_catalog;
create policy "authenticated read reward catalog"
  on public.reward_catalog for select
  using (auth.role() = 'authenticated');

drop policy if exists "users can manage own rewards" on public.user_rewards;
create policy "users can manage own rewards"
  on public.user_rewards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "authenticated read badges" on public.achievement_badges;
create policy "authenticated read badges"
  on public.achievement_badges for select
  using (auth.role() = 'authenticated');

drop policy if exists "users can view own badges" on public.user_badges;
create policy "users can view own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

create or replace function public.award_points(
  target_user_id uuid,
  amount integer,
  point_source text,
  point_source_ref text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set points = points + amount,
      updated_at = now()
  where id = target_user_id;

  insert into public.points_ledger(user_id, source, source_ref, points)
  values (target_user_id, point_source, point_source_ref, amount);
end;
$$;

create or replace function public.handle_user_workout_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.completed_date is not null then
    perform public.award_points(new.user_id, 10, 'workout_completed', new.id::text);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_workout_points on public.user_workouts;
create trigger trg_user_workout_points
after insert on public.user_workouts
for each row
execute function public.handle_user_workout_points();

create or replace function public.handle_wellness_log_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_points(new.user_id, 5, 'wellness_log', new.id::text);
  return new;
end;
$$;

drop trigger if exists trg_wellness_log_points on public.wellness_logs;
create trigger trg_wellness_log_points
after insert on public.wellness_logs
for each row
execute function public.handle_wellness_log_points();

create or replace function public.handle_challenge_completion_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reward_amount integer;
begin
  if new.completed = true and coalesce(old.completed, false) = false then
    select reward_points into reward_amount
    from public.challenges
    where id = new.challenge_id;

    perform public.award_points(new.user_id, coalesce(reward_amount, 100), 'challenge_completed', new.id::text);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_challenge_completion_points on public.challenge_participants;
create trigger trg_challenge_completion_points
after update on public.challenge_participants
for each row
execute function public.handle_challenge_completion_points();

insert into public.reward_catalog (title, description, points_cost)
select * from (
  values
    ('Gym Day Pass', 'Redeem a partner gym access day.', 500),
    ('Nutrition Consult', '15 minute AI-assisted nutrition review.', 900),
    ('Merch Discount', 'Apply a branded merchandise discount.', 1200)
) as seed(title, description, points_cost)
where not exists (
  select 1 from public.reward_catalog existing where existing.title = seed.title
);

insert into public.achievement_badges (slug, title, description, icon_name, points_threshold)
select * from (
  values
    ('first-workout', 'First Grind', 'Completed your first logged workout.', 'flash', 10),
    ('streak-7', 'Week Locked', 'Hit a 7-day consistency streak.', 'trophy', 70),
    ('points-500', 'Momentum', 'Earned 500 total points.', 'sparkles', 500)
) as seed(slug, title, description, icon_name, points_threshold)
where not exists (
  select 1 from public.achievement_badges existing where existing.slug = seed.slug
);
