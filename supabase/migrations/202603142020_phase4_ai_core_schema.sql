create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  duration_minutes integer,
  equipment_required text[] not null default '{}',
  calories_estimate integer,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  sport_tag text,
  video_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_workouts_category on public.workouts(category);
create index if not exists idx_workouts_difficulty on public.workouts(difficulty);

create table if not exists public.user_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id),
  scheduled_date date,
  completed_date timestamptz,
  reps jsonb,
  weight_used jsonb,
  rating integer check (rating between 1 and 5),
  perceived_difficulty integer check (perceived_difficulty between 1 and 5),
  calories_burned integer,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_workouts_user_date on public.user_workouts(user_id, scheduled_date);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  metric text not null,
  reward_points integer not null default 100,
  created_by uuid references public.users(id),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  progress_metric numeric not null default 0,
  rank integer,
  completed boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  meals jsonb not null,
  total_calories integer,
  ai_generated boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.wellness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  sleep_hours numeric(3,1),
  water_liters numeric(3,1),
  stress_level integer check (stress_level between 1 and 10),
  mood text check (mood in ('great', 'good', 'neutral', 'poor', 'terrible')),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.ml_models (
  user_id uuid primary key references public.users(id) on delete cascade,
  preferences_vector jsonb,
  input_hash text,
  last_updated timestamptz not null default now()
);

create table if not exists public.ai_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique not null,
  response text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_cache_key on public.ai_cache(cache_key);
create index if not exists idx_ai_cache_expires on public.ai_cache(expires_at);

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  feature text not null,
  input_tokens integer,
  output_tokens integer,
  model text,
  created_at timestamptz not null default now()
);

alter table public.workouts enable row level security;
alter table public.user_workouts enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.meal_plans enable row level security;
alter table public.wellness_logs enable row level security;
alter table public.ml_models enable row level security;
alter table public.ai_cache enable row level security;
alter table public.ai_usage_logs enable row level security;

drop policy if exists "authenticated read workouts" on public.workouts;
create policy "authenticated read workouts"
  on public.workouts for select
  using (auth.role() = 'authenticated');

drop policy if exists "users manage own workouts" on public.user_workouts;
create policy "users manage own workouts"
  on public.user_workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "authenticated read public challenges" on public.challenges;
create policy "authenticated read public challenges"
  on public.challenges for select
  using (auth.role() = 'authenticated' and is_public = true);

drop policy if exists "challenge creators manage challenges" on public.challenges;
create policy "challenge creators manage challenges"
  on public.challenges for all
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "users manage own challenge participation" on public.challenge_participants;
create policy "users manage own challenge participation"
  on public.challenge_participants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own meal plans" on public.meal_plans;
create policy "users manage own meal plans"
  on public.meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own wellness logs" on public.wellness_logs;
create policy "users manage own wellness logs"
  on public.wellness_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own ml models" on public.ml_models;
create policy "users manage own ml models"
  on public.ml_models for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own ai usage logs" on public.ai_usage_logs;
create policy "users manage own ai usage logs"
  on public.ai_usage_logs for all
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "deny direct ai cache access" on public.ai_cache;
create policy "deny direct ai cache access"
  on public.ai_cache for select
  using (false);

create or replace function public.cosine_similarity(a float[], b float[])
returns float
language plpgsql
as $$
declare
  dot float := 0;
  mag_a float := 0;
  mag_b float := 0;
  i int;
begin
  if array_length(a, 1) is null or array_length(b, 1) is null or array_length(a, 1) <> array_length(b, 1) then
    return 0;
  end if;

  for i in 1..array_length(a, 1) loop
    dot := dot + a[i] * b[i];
    mag_a := mag_a + a[i] ^ 2;
    mag_b := mag_b + b[i] ^ 2;
  end loop;

  if mag_a = 0 or mag_b = 0 then
    return 0;
  end if;

  return dot / (sqrt(mag_a) * sqrt(mag_b));
end;
$$;

create or replace function public.get_similar_users(target_user_id uuid, top_n int default 5)
returns table(user_id uuid, similarity float)
language plpgsql
as $$
declare
  target_vec float[];
begin
  select array(select jsonb_array_elements_text(preferences_vector)::float)
    into target_vec
  from public.ml_models
  where ml_models.user_id = target_user_id;

  return query
    select m.user_id,
           public.cosine_similarity(
             target_vec,
             array(select jsonb_array_elements_text(m.preferences_vector)::float)
           ) as similarity
    from public.ml_models m
    where m.user_id <> target_user_id
      and m.preferences_vector is not null
    order by similarity desc
    limit top_n;
end;
$$;
