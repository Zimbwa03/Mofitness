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

alter table if exists public.preferences
  add column if not exists country_code text,
  add column if not exists allergies text[] not null default '{}',
  add column if not exists cuisine_preferences text[] not null default '{}';

alter table if exists public.preferences
  drop constraint if exists preferences_country_code_check;

alter table if exists public.preferences
  add constraint preferences_country_code_check
    check (country_code is null or char_length(country_code) = 2);

create table if not exists public.nutrition_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  goal_type text not null,
  target_weight_kg numeric(5,1),
  current_weight_kg numeric(5,1) not null,
  target_body_fat_pct numeric(4,1),
  target_muscle_mass_kg numeric(5,1),
  target_date date not null,
  daily_calorie_target integer not null,
  protein_target_g integer not null,
  carbs_target_g integer not null,
  fat_target_g integer not null,
  fiber_target_g integer not null default 30,
  sodium_target_mg integer not null default 2300,
  water_target_min_liters numeric(3,1) not null,
  water_target_max_liters numeric(3,1) not null,
  meals_per_day integer not null,
  country_code text not null,
  cuisine_preference text[] not null default '{}',
  allergies_snapshot text[] not null default '{}',
  dietary_restrictions_snapshot text[] not null default '{}',
  medical_conditions_snapshot text not null default '',
  goal_summary text,
  safety_flags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrition_goals_goal_type_check check (
    goal_type in (
      'gain_weight','lose_weight','maintain_weight',
      'build_muscle','cut_fat','athletic_performance',
      'general_health','medical_dietary'
    )
  ),
  constraint nutrition_goals_meals_per_day_check check (meals_per_day between 1 and 6),
  constraint nutrition_goals_country_code_check check (char_length(country_code) = 2),
  constraint nutrition_goals_water_range_check check (water_target_max_liters >= water_target_min_liters)
);

create table if not exists public.country_cuisines (
  country_code text primary key,
  country_name text not null,
  cuisine_tags text[] not null default '{}',
  staples text[] not null default '{}',
  proteins text[] not null default '{}',
  carbs text[] not null default '{}',
  vegetables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint country_cuisines_country_code_check check (char_length(country_code) = 2)
);

create table if not exists public.regional_foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  local_name text,
  country_codes text[] not null default '{}',
  calories_per_100g numeric(6,1) not null,
  protein_g numeric(6,1) not null default 0,
  carbs_g numeric(6,1) not null default 0,
  fat_g numeric(6,1) not null default 0,
  fiber_g numeric(6,1) not null default 0,
  iron_mg numeric(6,2),
  calcium_mg numeric(6,1),
  sodium_mg numeric(6,1),
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regional_foods_category_check check (
    category in ('grain','protein','vegetable','fruit','dairy','fat','legume','mixed_dish','beverage')
  )
);

create table if not exists public.daily_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  goal_id uuid not null references public.nutrition_goals(id) on delete cascade,
  plan_date date not null,
  day_number integer not null,
  total_calories integer not null,
  total_protein_g numeric(6,1) not null,
  total_carbs_g numeric(6,1) not null,
  total_fat_g numeric(6,1) not null,
  total_fiber_g numeric(6,1),
  total_sodium_mg integer,
  water_target_liters numeric(3,1) not null,
  water_schedule jsonb not null default '[]'::jsonb,
  meals jsonb not null,
  ai_notes text,
  workout_day boolean not null default false,
  generated_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date),
  constraint daily_meal_plans_day_number_check check (day_number > 0),
  constraint daily_meal_plans_meals_json_check check (jsonb_typeof(meals) = 'array'),
  constraint daily_meal_plans_water_schedule_json_check check (jsonb_typeof(water_schedule) = 'array')
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid references public.daily_meal_plans(id) on delete set null,
  meal_slot text not null,
  logged_at timestamptz not null default now(),
  log_date date not null default current_date,
  log_method text not null,
  meal_name text,
  dishes jsonb not null,
  total_calories integer,
  total_protein_g numeric(6,1),
  total_carbs_g numeric(6,1),
  total_fat_g numeric(6,1),
  description text,
  photo_url text,
  photo_storage_path text,
  ai_accuracy_score numeric(5,2),
  ai_confidence numeric(5,2),
  ai_analysis jsonb,
  ai_identified_dishes jsonb,
  feed_eligible boolean not null default false,
  posted_to_feed boolean not null default false,
  feed_post_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_logs_slot_check check (meal_slot in ('breakfast','lunch','dinner','snack_1','snack_2','snack_3')),
  constraint meal_logs_method_check check (log_method in ('photo','manual','ai_suggested')),
  constraint meal_logs_dishes_json_check check (jsonb_typeof(dishes) = 'array'),
  constraint meal_logs_accuracy_check check (ai_accuracy_score is null or (ai_accuracy_score >= 0 and ai_accuracy_score <= 100)),
  constraint meal_logs_confidence_check check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 100))
);

create table if not exists public.body_metric_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  log_date date not null,
  weight_kg numeric(5,1),
  body_fat_pct numeric(4,1),
  muscle_mass_kg numeric(5,1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  amount_ml integer not null,
  log_date date not null,
  created_at timestamptz not null default now(),
  constraint water_logs_amount_ml_check check (amount_ml > 0)
);

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_log_id uuid not null unique references public.meal_logs(id) on delete cascade,
  caption text,
  audience text not null default 'everyone',
  show_stats_card boolean not null default true,
  public_photo_url text not null,
  public_photo_path text,
  meal_name text not null,
  total_calories integer,
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  ai_accuracy_score numeric(5,2),
  confidence_score numeric(5,2),
  country_code text,
  cuisine_tag text,
  goal_tag text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  rating_avg numeric(3,1) not null default 0,
  rating_count integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_posts_audience_check check (audience in ('everyone','fitness_community','following')),
  constraint feed_posts_accuracy_check check (ai_accuracy_score is null or (ai_accuracy_score >= 0 and ai_accuracy_score <= 100)),
  constraint feed_posts_confidence_check check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100)),
  constraint feed_posts_country_code_check check (country_code is null or char_length(country_code) = 2)
);

create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  parent_comment_id uuid references public.feed_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_comments_body_length_check check (char_length(trim(body)) between 1 and 500)
);

create table if not exists public.feed_likes (
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  liked_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.feed_ratings (
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  rating integer not null,
  rated_at timestamptz not null default now(),
  primary key (user_id, post_id),
  constraint feed_ratings_rating_check check (rating between 1 and 5)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'meal_logs_feed_post_id_fkey'
  ) then
    alter table public.meal_logs
      add constraint meal_logs_feed_post_id_fkey
      foreign key (feed_post_id)
      references public.feed_posts(id)
      on delete set null;
  end if;
end
$$;

create unique index if not exists ux_nutrition_goals_active_user
  on public.nutrition_goals(user_id)
  where is_active = true;
create index if not exists idx_nutrition_goals_user_created on public.nutrition_goals(user_id, created_at desc);
create index if not exists idx_daily_meal_plans_user_date on public.daily_meal_plans(user_id, plan_date desc);
create index if not exists idx_daily_meal_plans_goal on public.daily_meal_plans(goal_id, plan_date desc);
create index if not exists idx_meal_logs_user_date on public.meal_logs(user_id, logged_at desc);
create index if not exists idx_meal_logs_plan on public.meal_logs(plan_id);
create index if not exists idx_feed_posts_created on public.feed_posts(created_at desc);
create index if not exists idx_feed_posts_country on public.feed_posts(country_code, created_at desc);
create index if not exists idx_feed_posts_goal_tag on public.feed_posts(goal_tag, created_at desc);
create index if not exists idx_feed_comments_post on public.feed_comments(post_id, created_at asc);
create index if not exists idx_feed_likes_post on public.feed_likes(post_id);
create index if not exists idx_feed_ratings_post on public.feed_ratings(post_id);
create index if not exists idx_water_logs_user_date on public.water_logs(user_id, log_date desc);
create index if not exists idx_body_metric_logs_user_date on public.body_metric_logs(user_id, log_date desc);
create unique index if not exists ux_country_cuisines_country_code on public.country_cuisines(country_code);
create unique index if not exists ux_regional_foods_name_ci on public.regional_foods(lower(name));
create index if not exists idx_regional_foods_category on public.regional_foods(category);
create index if not exists idx_regional_foods_country_codes on public.regional_foods using gin (country_codes);

alter table public.nutrition_goals enable row level security;
alter table public.country_cuisines enable row level security;
alter table public.regional_foods enable row level security;
alter table public.daily_meal_plans enable row level security;
alter table public.meal_logs enable row level security;
alter table public.body_metric_logs enable row level security;
alter table public.water_logs enable row level security;
alter table public.feed_posts enable row level security;
alter table public.feed_comments enable row level security;
alter table public.feed_likes enable row level security;
alter table public.feed_ratings enable row level security;

drop policy if exists "users manage own nutrition goals" on public.nutrition_goals;
create policy "users manage own nutrition goals"
  on public.nutrition_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "authenticated read country cuisines" on public.country_cuisines;
create policy "authenticated read country cuisines"
  on public.country_cuisines for select
  using (auth.role() = 'authenticated');

drop policy if exists "authenticated read regional foods" on public.regional_foods;
create policy "authenticated read regional foods"
  on public.regional_foods for select
  using (auth.role() = 'authenticated');

drop policy if exists "users manage own daily meal plans" on public.daily_meal_plans;
create policy "users manage own daily meal plans"
  on public.daily_meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own meal logs" on public.meal_logs;
create policy "users manage own meal logs"
  on public.meal_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own body metric logs" on public.body_metric_logs;
create policy "users manage own body metric logs"
  on public.body_metric_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own water logs" on public.water_logs;
create policy "users manage own water logs"
  on public.water_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "authenticated read visible feed posts" on public.feed_posts;
create policy "authenticated read visible feed posts"
  on public.feed_posts for select
  using (auth.role() = 'authenticated' and (is_visible = true or auth.uid() = user_id));

drop policy if exists "users manage own feed posts" on public.feed_posts;
create policy "users manage own feed posts"
  on public.feed_posts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "authenticated read feed comments" on public.feed_comments;
create policy "authenticated read feed comments"
  on public.feed_comments for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1
      from public.feed_posts p
      where p.id = post_id
        and (p.is_visible = true or p.user_id = auth.uid())
    )
  );

drop policy if exists "users insert own feed comments" on public.feed_comments;
create policy "users insert own feed comments"
  on public.feed_comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.feed_posts p
      where p.id = post_id
        and p.is_visible = true
    )
  );

drop policy if exists "users update own feed comments" on public.feed_comments;
create policy "users update own feed comments"
  on public.feed_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own feed comments" on public.feed_comments;
create policy "users delete own feed comments"
  on public.feed_comments for delete
  using (auth.uid() = user_id);

drop policy if exists "authenticated read feed likes" on public.feed_likes;
create policy "authenticated read feed likes"
  on public.feed_likes for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1
      from public.feed_posts p
      where p.id = post_id
        and (p.is_visible = true or p.user_id = auth.uid())
    )
  );

drop policy if exists "users manage own feed likes" on public.feed_likes;
create policy "users manage own feed likes"
  on public.feed_likes for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.feed_posts p
      where p.id = post_id
        and p.is_visible = true
    )
  );

drop policy if exists "authenticated read feed ratings" on public.feed_ratings;
create policy "authenticated read feed ratings"
  on public.feed_ratings for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1
      from public.feed_posts p
      where p.id = post_id
        and (p.is_visible = true or p.user_id = auth.uid())
    )
  );

drop policy if exists "users manage own feed ratings" on public.feed_ratings;
create policy "users manage own feed ratings"
  on public.feed_ratings for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.feed_posts p
      where p.id = post_id
        and p.is_visible = true
    )
  );

create or replace function public.recalculate_feed_post_counters(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.feed_posts p
  set likes_count = (
        select count(*)
        from public.feed_likes l
        where l.post_id = target_post_id
      ),
      comments_count = (
        select count(*)
        from public.feed_comments c
        where c.post_id = target_post_id
      ),
      rating_count = (
        select count(*)
        from public.feed_ratings r
        where r.post_id = target_post_id
      ),
      rating_avg = coalesce((
        select round(avg(r.rating)::numeric, 1)
        from public.feed_ratings r
        where r.post_id = target_post_id
      ), 0),
      updated_at = now()
  where p.id = target_post_id;
end;
$$;

create or replace function public.handle_feed_post_counter_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_post_id uuid;
begin
  affected_post_id := coalesce(new.post_id, old.post_id);
  perform public.recalculate_feed_post_counters(affected_post_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.sync_meal_log_feed_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.meal_logs
    set posted_to_feed = true,
        feed_post_id = new.id,
        updated_at = now()
    where id = new.meal_log_id;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    update public.meal_logs
    set posted_to_feed = true,
        feed_post_id = new.id,
        updated_at = now()
    where id = new.meal_log_id;

    if old.meal_log_id is distinct from new.meal_log_id then
      update public.meal_logs
      set posted_to_feed = false,
          feed_post_id = null,
          updated_at = now()
      where id = old.meal_log_id;
    end if;

    return new;
  end if;

  update public.meal_logs
  set posted_to_feed = false,
      feed_post_id = null,
      updated_at = now()
  where id = old.meal_log_id;
  return old;
end;
$$;

drop trigger if exists trg_nutrition_goals_updated_at on public.nutrition_goals;
create trigger trg_nutrition_goals_updated_at
before update on public.nutrition_goals
for each row execute function public.set_updated_at();

drop trigger if exists trg_country_cuisines_updated_at on public.country_cuisines;
create trigger trg_country_cuisines_updated_at
before update on public.country_cuisines
for each row execute function public.set_updated_at();

drop trigger if exists trg_regional_foods_updated_at on public.regional_foods;
create trigger trg_regional_foods_updated_at
before update on public.regional_foods
for each row execute function public.set_updated_at();

drop trigger if exists trg_daily_meal_plans_updated_at on public.daily_meal_plans;
create trigger trg_daily_meal_plans_updated_at
before update on public.daily_meal_plans
for each row execute function public.set_updated_at();

drop trigger if exists trg_meal_logs_updated_at on public.meal_logs;
create trigger trg_meal_logs_updated_at
before update on public.meal_logs
for each row execute function public.set_updated_at();

drop trigger if exists trg_body_metric_logs_updated_at on public.body_metric_logs;
create trigger trg_body_metric_logs_updated_at
before update on public.body_metric_logs
for each row execute function public.set_updated_at();

drop trigger if exists trg_feed_posts_updated_at on public.feed_posts;
create trigger trg_feed_posts_updated_at
before update on public.feed_posts
for each row execute function public.set_updated_at();

drop trigger if exists trg_feed_comments_updated_at on public.feed_comments;
create trigger trg_feed_comments_updated_at
before update on public.feed_comments
for each row execute function public.set_updated_at();

drop trigger if exists trg_feed_likes_counter on public.feed_likes;
create trigger trg_feed_likes_counter
after insert or delete on public.feed_likes
for each row execute function public.handle_feed_post_counter_change();

drop trigger if exists trg_feed_comments_counter on public.feed_comments;
create trigger trg_feed_comments_counter
after insert or delete on public.feed_comments
for each row execute function public.handle_feed_post_counter_change();

drop trigger if exists trg_feed_ratings_counter on public.feed_ratings;
create trigger trg_feed_ratings_counter
after insert or update or delete on public.feed_ratings
for each row execute function public.handle_feed_post_counter_change();

drop trigger if exists trg_sync_meal_log_feed_status on public.feed_posts;
create trigger trg_sync_meal_log_feed_status
after insert or update or delete on public.feed_posts
for each row execute function public.sync_meal_log_feed_status();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select * from (
  values
    ('meal-photos', 'meal-photos', false, 4194304, array['image/jpeg','image/png','image/webp']::text[]),
    ('meal-feed', 'meal-feed', true, 4194304, array['image/jpeg','image/png','image/webp']::text[]),
    ('meal-plan-images', 'meal-plan-images', true, 4194304, array['image/jpeg','image/png','image/webp','image/svg+xml']::text[])
) as seed(id, name, public, file_size_limit, allowed_mime_types)
where not exists (
  select 1 from storage.buckets b where b.id = seed.id
);

drop policy if exists "meal photos read own" on storage.objects;
create policy "meal photos read own"
  on storage.objects for select
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "meal photos insert own" on storage.objects;
create policy "meal photos insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "meal photos update own" on storage.objects;
create policy "meal photos update own"
  on storage.objects for update
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "meal photos delete own" on storage.objects;
create policy "meal photos delete own"
  on storage.objects for delete
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "meal feed public read" on storage.objects;
create policy "meal feed public read"
  on storage.objects for select
  using (bucket_id = 'meal-feed');

drop policy if exists "meal plan images public read" on storage.objects;
create policy "meal plan images public read"
  on storage.objects for select
  using (bucket_id = 'meal-plan-images');

insert into public.country_cuisines (
  country_code,
  country_name,
  cuisine_tags,
  staples,
  proteins,
  carbs,
  vegetables
)
values
  ('ZW', 'Zimbabwe', array['sadza','nyama','muriwo','matemba','nhopi','maputi','mahewu','amasi'], array['sadza','mutakura','muriwo','maputi'], array['beef','chicken','goat','tilapia','matemba'], array['sadza','sweet_potato','cassava','rice'], array['morogo','tomato','onion','cucumber']),
  ('ZA', 'South Africa', array['pap','braai','boerewors','bobotie','vetkoek'], array['pap','samp','vetkoek'], array['beef','lamb','chicken','snoek'], array['pap','rice','bread'], array['spinach','butternut','peas','carrots']),
  ('NG', 'Nigeria', array['jollof_rice','egusi','suya','pounded_yam','moi_moi'], array['yam','rice','cassava'], array['beef','goat','tilapia','catfish','chicken'], array['yam','rice','plantain','cassava'], array['ugu','spinach','tomato','pepper']),
  ('KE', 'Kenya', array['ugali','nyama_choma','sukuma_wiki','githeri','irio'], array['ugali','githeri','chapati'], array['beef','goat','tilapia','chicken'], array['ugali','rice','chapati','sweet_potato'], array['sukuma_wiki','spinach','cabbage','tomato']),
  ('ET', 'Ethiopia', array['injera','tibs','shiro','kitfo','doro_wat'], array['injera','teff','rice'], array['beef','lamb','chicken','lentils','chickpeas'], array['injera','teff','rice'], array['gomen','tomato','onion']),
  ('GH', 'Ghana', array['fufu','jollof_rice','kelewele','waakye','kenkey'], array['fufu','rice','yam','plantain'], array['tilapia','catfish','chicken','beef','tuna'], array['fufu','rice','yam','plantain'], array['garden_egg','tomato','pepper','spinach']),
  ('IN', 'India', array['dal','rice','roti','curry','sabzi','biryani'], array['rice','roti','potato'], array['chicken','mutton','fish','lentils','paneer','eggs'], array['rice','roti','bread','potato'], array['spinach','cauliflower','potato','tomato','onion']),
  ('US', 'United States', array['oats','chili','grilled_chicken','sweet_potato','yogurt_bowl'], array['oats','potato','rice','bread'], array['chicken','beef','turkey','salmon','eggs','greek_yogurt'], array['oats','rice','potato','bread'], array['broccoli','spinach','kale','tomato'])
on conflict (country_code) do update
set country_name = excluded.country_name,
    cuisine_tags = excluded.cuisine_tags,
    staples = excluded.staples,
    proteins = excluded.proteins,
    carbs = excluded.carbs,
    vegetables = excluded.vegetables,
    updated_at = now();

insert into public.regional_foods (
  name,
  local_name,
  country_codes,
  calories_per_100g,
  protein_g,
  carbs_g,
  fat_g,
  fiber_g,
  iron_mg,
  calcium_mg,
  sodium_mg,
  category
)
select seed.name,
       seed.local_name,
       seed.country_codes,
       seed.calories_per_100g,
       seed.protein_g,
       seed.carbs_g,
       seed.fat_g,
       seed.fiber_g,
       seed.iron_mg,
       seed.calcium_mg,
       seed.sodium_mg,
       seed.category
from (
  values
    ('Sadza (Cooked)', 'Isitshwala', array['ZW','ZA']::text[], 97.0, 2.3, 21.0, 0.4, 1.8, 0.8, 2.0, 2.0, 'grain'),
    ('Ugali (Cooked)', null, array['KE','TZ','UG']::text[], 92.0, 2.0, 20.5, 0.3, 1.5, 0.7, 1.5, 2.0, 'grain'),
    ('Injera', null, array['ET','ER']::text[], 115.0, 3.5, 23.5, 0.8, 1.6, 4.5, 60.0, 120.0, 'grain'),
    ('Morogo (African Leafy Greens)', 'Imifino', array['ZW','ZA']::text[], 25.0, 3.2, 3.8, 0.4, 2.1, 5.1, 150.0, 40.0, 'vegetable'),
    ('Matemba (Dried Kapenta Fish)', null, array['ZW','ZM']::text[], 340.0, 68.0, 0.0, 7.0, 0.0, 4.2, 800.0, 420.0, 'protein'),
    ('Mutakura (Mixed Beans and Maize)', null, array['ZW']::text[], 145.0, 7.0, 23.0, 1.5, 5.2, 2.4, 28.0, 120.0, 'legume'),
    ('Jollof Rice', null, array['NG','GH']::text[], 180.0, 3.6, 31.0, 4.5, 2.0, 0.8, 14.0, 290.0, 'mixed_dish'),
    ('Suya Beef', null, array['NG']::text[], 235.0, 29.0, 3.0, 12.0, 0.5, 3.0, 18.0, 320.0, 'protein'),
    ('Sukuma Wiki', null, array['KE']::text[], 33.0, 2.9, 5.6, 0.7, 3.5, 1.6, 230.0, 55.0, 'vegetable'),
    ('Nyama Choma', null, array['KE','TZ']::text[], 250.0, 27.0, 0.0, 16.0, 0.0, 2.8, 22.0, 85.0, 'protein'),
    ('Dal (Cooked Lentils)', null, array['IN']::text[], 116.0, 9.0, 20.0, 0.4, 8.0, 3.3, 19.0, 240.0, 'legume'),
    ('Paneer', null, array['IN']::text[], 265.0, 18.0, 1.2, 20.0, 0.0, 0.2, 208.0, 22.0, 'dairy'),
    ('Oats Porridge', null, array['US','GB']::text[], 68.0, 2.4, 12.0, 1.4, 1.7, 0.9, 80.0, 49.0, 'grain'),
    ('Greek Yogurt', null, array['US','GR']::text[], 59.0, 10.0, 3.6, 0.4, 0.0, 0.1, 110.0, 36.0, 'dairy'),
    ('Sweet Potato (Boiled)', null, array['ZW','KE','US']::text[], 76.0, 1.4, 17.7, 0.1, 2.5, 0.6, 27.0, 55.0, 'grain'),
    ('Groundnut Stew', null, array['ZW','GH','NG']::text[], 185.0, 8.0, 10.0, 13.0, 2.1, 1.8, 45.0, 280.0, 'mixed_dish')
) as seed(
  name,
  local_name,
  country_codes,
  calories_per_100g,
  protein_g,
  carbs_g,
  fat_g,
  fiber_g,
  iron_mg,
  calcium_mg,
  sodium_mg,
  category
)
where not exists (
  select 1
  from public.regional_foods rf
  where lower(rf.name) = lower(seed.name)
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime'
        and n.nspname = 'public'
        and c.relname = 'feed_posts'
    ) then
      alter publication supabase_realtime add table public.feed_posts;
    end if;

    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime'
        and n.nspname = 'public'
        and c.relname = 'feed_comments'
    ) then
      alter publication supabase_realtime add table public.feed_comments;
    end if;

    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime'
        and n.nspname = 'public'
        and c.relname = 'feed_likes'
    ) then
      alter publication supabase_realtime add table public.feed_likes;
    end if;
  end if;
end
$$;

commit;
