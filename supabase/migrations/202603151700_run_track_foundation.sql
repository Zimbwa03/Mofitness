begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.saved_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  description text,
  route_polyline jsonb not null default '[]'::jsonb,
  distance_meters numeric(10,2),
  elevation_gain_m numeric(7,1),
  difficulty text check (difficulty in ('easy','moderate','hard')),
  surface text,
  country_code text not null,
  city text,
  start_lat numeric(10,7),
  start_lng numeric(10,7),
  times_run integer not null default 0,
  avg_rating numeric(3,1) not null default 0,
  is_ai_suggested boolean not null default false,
  is_public boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.saved_routes
  add column if not exists route_polyline jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists is_public boolean not null default false,
  add column if not exists tags text[] not null default '{}';

alter table public.saved_routes
  drop constraint if exists saved_routes_route_polyline_array_check,
  add constraint saved_routes_route_polyline_array_check
    check (jsonb_typeof(route_polyline) = 'array');

alter table public.saved_routes
  drop constraint if exists saved_routes_distance_check,
  add constraint saved_routes_distance_check
    check (distance_meters is null or distance_meters >= 0);

alter table public.saved_routes
  drop constraint if exists saved_routes_elevation_check,
  add constraint saved_routes_elevation_check
    check (elevation_gain_m is null or elevation_gain_m >= 0);

alter table public.saved_routes
  drop constraint if exists saved_routes_avg_rating_check,
  add constraint saved_routes_avg_rating_check
    check (avg_rating >= 0 and avg_rating <= 5);

create index if not exists idx_saved_routes_user_created on public.saved_routes(user_id, created_at desc);
create index if not exists idx_saved_routes_location on public.saved_routes(country_code, city);
create index if not exists idx_saved_routes_public on public.saved_routes(is_public);
create unique index if not exists ux_saved_routes_name_ci on public.saved_routes(user_id, lower(name));

create table if not exists public.run_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  activity_type text not null check (activity_type in (
    'outdoor_run','walk','power_walk','outdoor_cycle','treadmill','trail_run','interval_run'
  )),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  distance_meters numeric(10,2),
  elevation_gain_m numeric(7,1),
  elevation_loss_m numeric(7,1),
  avg_pace_sec_per_km integer,
  best_pace_sec_per_km integer,
  avg_speed_kmh numeric(5,2),
  max_speed_kmh numeric(5,2),
  total_steps integer,
  avg_cadence_spm integer,
  avg_stride_length_m numeric(4,2),
  avg_heart_rate_bpm integer,
  max_heart_rate_bpm integer,
  calories_burned integer,
  route_polyline jsonb not null default '[]'::jsonb,
  start_lat numeric(10,7),
  start_lng numeric(10,7),
  end_lat numeric(10,7),
  end_lng numeric(10,7),
  route_name text,
  country_code text,
  city text,
  target_distance_m numeric(10,2),
  target_duration_s integer,
  target_pace_sec_km integer,
  goal_achieved boolean not null default false,
  km_splits jsonb not null default '[]'::jsonb,
  interval_config jsonb,
  interval_results jsonb,
  ai_coaching_notes text,
  perceived_effort integer check (perceived_effort between 1 and 10),
  mood_after text,
  notes text,
  is_public boolean not null default false,
  cover_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.run_sessions
  add column if not exists route_polyline jsonb not null default '[]'::jsonb,
  add column if not exists km_splits jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.run_sessions
  drop constraint if exists run_sessions_route_polyline_array_check,
  add constraint run_sessions_route_polyline_array_check
    check (jsonb_typeof(route_polyline) = 'array');

alter table public.run_sessions
  drop constraint if exists run_sessions_km_splits_array_check,
  add constraint run_sessions_km_splits_array_check
    check (jsonb_typeof(km_splits) = 'array');

alter table public.run_sessions
  drop constraint if exists run_sessions_duration_check,
  add constraint run_sessions_duration_check
    check (duration_seconds is null or duration_seconds >= 0);

alter table public.run_sessions
  drop constraint if exists run_sessions_distance_check,
  add constraint run_sessions_distance_check
    check (distance_meters is null or distance_meters >= 0);

alter table public.run_sessions
  drop constraint if exists run_sessions_steps_check,
  add constraint run_sessions_steps_check
    check (total_steps is null or total_steps >= 0);

create index if not exists idx_run_sessions_user_date on public.run_sessions(user_id, started_at desc);
create index if not exists idx_run_sessions_location on public.run_sessions(country_code, city);
create index if not exists idx_run_sessions_activity_type on public.run_sessions(activity_type);
create index if not exists idx_run_sessions_goal_achieved on public.run_sessions(goal_achieved);

create table if not exists public.run_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  record_type text not null,
  value numeric not null,
  unit text not null check (unit in ('seconds','meters')),
  session_id uuid references public.run_sessions(id) on delete set null,
  achieved_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, record_type)
);

alter table public.run_records
  drop constraint if exists run_records_record_type_check,
  add constraint run_records_record_type_check
    check (record_type in ('1km','5km','10km','21km','42km','fastest_pace','longest_run','best_streak'));

alter table public.run_records
  drop constraint if exists run_records_value_check,
  add constraint run_records_value_check
    check (value > 0);

create index if not exists idx_run_records_user_type on public.run_records(user_id, record_type);
create index if not exists idx_run_records_achieved_at on public.run_records(achieved_at desc);

drop trigger if exists trg_saved_routes_updated_at on public.saved_routes;
create trigger trg_saved_routes_updated_at
before update on public.saved_routes
for each row execute function public.set_updated_at();

drop trigger if exists trg_run_sessions_updated_at on public.run_sessions;
create trigger trg_run_sessions_updated_at
before update on public.run_sessions
for each row execute function public.set_updated_at();

drop trigger if exists trg_run_records_updated_at on public.run_records;
create trigger trg_run_records_updated_at
before update on public.run_records
for each row execute function public.set_updated_at();

alter table public.saved_routes enable row level security;
alter table public.run_sessions enable row level security;
alter table public.run_records enable row level security;

drop policy if exists "users read own and public saved routes" on public.saved_routes;
create policy "users read own and public saved routes"
  on public.saved_routes for select
  using ((auth.uid() = user_id) or user_id is null or is_public = true);

drop policy if exists "users insert own saved routes" on public.saved_routes;
create policy "users insert own saved routes"
  on public.saved_routes for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own saved routes" on public.saved_routes;
create policy "users update own saved routes"
  on public.saved_routes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own saved routes" on public.saved_routes;
create policy "users delete own saved routes"
  on public.saved_routes for delete
  using (auth.uid() = user_id);

drop policy if exists "users manage own run sessions" on public.run_sessions;
create policy "users manage own run sessions"
  on public.run_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own run records" on public.run_records;
create policy "users manage own run records"
  on public.run_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
