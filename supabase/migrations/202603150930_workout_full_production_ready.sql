-- MOFITNESS Workout Feature: Production-Ready Schema + Seed
-- Safe to re-run (idempotent where possible)

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

-- Foundation: exercises table (this migration hardens and seeds it)
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  muscle_primary text[] not null default '{}',
  muscle_secondary text[] not null default '{}',
  equipment_required text[] not null default '{}',
  difficulty text not null default 'beginner',
  animation_key text not null default 'rest',
  met numeric(4,1) not null default 1.0,
  coaching_cues text[] not null default '{}',
  description text,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hardening: exercises
alter table if exists public.exercises
  add column if not exists muscle_primary text[] not null default '{}',
  add column if not exists muscle_secondary text[] not null default '{}',
  add column if not exists equipment_required text[] not null default '{}',
  add column if not exists difficulty text not null default 'beginner',
  add column if not exists animation_key text,
  add column if not exists met numeric(4,1) not null default 1.0,
  add column if not exists coaching_cues text[] not null default '{}',
  add column if not exists description text,
  add column if not exists video_url text,
  add column if not exists updated_at timestamptz not null default now();

update public.exercises
set animation_key = 'rest'
where animation_key is null;

alter table public.exercises
  alter column animation_key set not null;

alter table public.exercises
  drop constraint if exists exercises_category_check,
  add constraint exercises_category_check
    check (category in ('strength','cardio','hiit','flexibility','recovery','core','sport'));

alter table public.exercises
  drop constraint if exists exercises_difficulty_check,
  add constraint exercises_difficulty_check
    check (difficulty in ('beginner','intermediate','advanced'));

alter table public.exercises
  drop constraint if exists exercises_met_check,
  add constraint exercises_met_check
    check (met > 0);

create unique index if not exists ux_exercises_name_ci on public.exercises (lower(name));
create index if not exists idx_exercises_category on public.exercises(category);
create index if not exists idx_exercises_difficulty on public.exercises(difficulty);
create index if not exists idx_exercises_animation_key on public.exercises(animation_key);
create index if not exists idx_exercises_muscle_primary_gin on public.exercises using gin (muscle_primary);
create index if not exists idx_exercises_equipment_gin on public.exercises using gin (equipment_required);

-- Hardening: workout_templates
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  format text not null,
  difficulty text not null,
  duration_minutes integer not null,
  calories_estimate integer,
  muscle_groups text[] not null default '{}',
  equipment text[] not null default '{}',
  exercises jsonb not null default '[]'::jsonb,
  thumbnail_url text,
  is_featured boolean not null default false,
  created_by text not null default 'mofitness',
  rating_avg numeric(3,1) not null default 0,
  times_completed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_templates
  add column if not exists updated_at timestamptz not null default now();

alter table public.workout_templates
  drop constraint if exists workout_templates_category_check,
  add constraint workout_templates_category_check
    check (category in ('strength','cardio','hiit','flexibility','recovery','core','sport'));

alter table public.workout_templates
  drop constraint if exists workout_templates_format_check,
  add constraint workout_templates_format_check
    check (format in ('sets_reps','timed','amrap','emom','tabata','circuit','superset','drop_set','for_time','running'));

alter table public.workout_templates
  drop constraint if exists workout_templates_difficulty_check,
  add constraint workout_templates_difficulty_check
    check (difficulty in ('beginner','intermediate','advanced'));

alter table public.workout_templates
  drop constraint if exists workout_templates_duration_check,
  add constraint workout_templates_duration_check
    check (duration_minutes > 0);

alter table public.workout_templates
  drop constraint if exists workout_templates_rating_avg_check,
  add constraint workout_templates_rating_avg_check
    check (rating_avg >= 0 and rating_avg <= 5);

alter table public.workout_templates
  drop constraint if exists workout_templates_times_completed_check,
  add constraint workout_templates_times_completed_check
    check (times_completed >= 0);

alter table public.workout_templates
  drop constraint if exists workout_templates_exercises_array_check,
  add constraint workout_templates_exercises_array_check
    check (jsonb_typeof(exercises) = 'array');

create unique index if not exists ux_workout_templates_name_ci on public.workout_templates (lower(name));
create index if not exists idx_workout_templates_category on public.workout_templates(category);
create index if not exists idx_workout_templates_difficulty on public.workout_templates(difficulty);
create index if not exists idx_workout_templates_format on public.workout_templates(format);
create index if not exists idx_workout_templates_featured on public.workout_templates(is_featured);
create index if not exists idx_workout_templates_created_by on public.workout_templates(created_by);
create index if not exists idx_workout_templates_exercises_gin on public.workout_templates using gin (exercises);

-- Saved workouts
create table if not exists public.saved_workouts (
  user_id uuid not null references public.users(id) on delete cascade,
  workout_id uuid not null references public.workout_templates(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, workout_id)
);
create index if not exists idx_saved_workouts_workout_id on public.saved_workouts(workout_id);

-- Playlist tracks
create table if not exists public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id text not null,
  title text not null,
  artist text not null,
  duration_s integer not null,
  storage_path text not null,
  bpm integer,
  mood text,
  order_idx integer,
  created_at timestamptz not null default now()
);

alter table public.playlist_tracks
  drop constraint if exists playlist_tracks_duration_check,
  add constraint playlist_tracks_duration_check
    check (duration_s > 0);

create index if not exists idx_playlist_tracks_playlist on public.playlist_tracks(playlist_id, order_idx);
create index if not exists idx_playlist_tracks_mood on public.playlist_tracks(mood);

-- User tracks
create table if not exists public.user_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  artist text,
  duration_s integer,
  file_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_tracks
  add column if not exists updated_at timestamptz not null default now();

alter table public.user_tracks
  drop constraint if exists user_tracks_duration_check,
  add constraint user_tracks_duration_check
    check (duration_s is null or duration_s > 0);

create index if not exists idx_user_tracks_user_id on public.user_tracks(user_id);

-- Personal records
create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  pr_type text not null,
  value numeric not null,
  unit text,
  achieved_at timestamptz not null,
  workout_id uuid references public.user_workouts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id, pr_type)
);

alter table public.personal_records
  add column if not exists updated_at timestamptz not null default now();

alter table public.personal_records
  drop constraint if exists personal_records_pr_type_check,
  add constraint personal_records_pr_type_check
    check (pr_type in ('weight_x_reps','1rm_estimate','max_reps','time'));

alter table public.personal_records
  drop constraint if exists personal_records_value_check,
  add constraint personal_records_value_check
    check (value > 0);

create index if not exists idx_personal_records_user_exercise on public.personal_records(user_id, exercise_id);
create index if not exists idx_personal_records_achieved_at on public.personal_records(achieved_at desc);

-- updated_at triggers

drop trigger if exists trg_exercises_updated_at on public.exercises;
create trigger trg_exercises_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

drop trigger if exists trg_workout_templates_updated_at on public.workout_templates;
create trigger trg_workout_templates_updated_at
before update on public.workout_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_tracks_updated_at on public.user_tracks;
create trigger trg_user_tracks_updated_at
before update on public.user_tracks
for each row execute function public.set_updated_at();

drop trigger if exists trg_personal_records_updated_at on public.personal_records;
create trigger trg_personal_records_updated_at
before update on public.personal_records
for each row execute function public.set_updated_at();

-- RLS
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.saved_workouts enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.user_tracks enable row level security;
alter table public.personal_records enable row level security;

drop policy if exists "authenticated read exercises" on public.exercises;
create policy "authenticated read exercises"
  on public.exercises for select
  using (auth.role() = 'authenticated');

drop policy if exists "authenticated read workout templates" on public.workout_templates;
create policy "authenticated read workout templates"
  on public.workout_templates for select
  using (auth.role() = 'authenticated');

drop policy if exists "users insert own workout templates" on public.workout_templates;
create policy "users insert own workout templates"
  on public.workout_templates for insert
  with check (created_by = auth.uid()::text);

drop policy if exists "users update own workout templates" on public.workout_templates;
create policy "users update own workout templates"
  on public.workout_templates for update
  using (created_by = auth.uid()::text)
  with check (created_by = auth.uid()::text);

drop policy if exists "users delete own workout templates" on public.workout_templates;
create policy "users delete own workout templates"
  on public.workout_templates for delete
  using (created_by = auth.uid()::text);

drop policy if exists "users manage own saved workouts" on public.saved_workouts;
create policy "users manage own saved workouts"
  on public.saved_workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "authenticated read playlist tracks" on public.playlist_tracks;
create policy "authenticated read playlist tracks"
  on public.playlist_tracks for select
  using (auth.role() = 'authenticated');

drop policy if exists "users manage own tracks" on public.user_tracks;
create policy "users manage own tracks"
  on public.user_tracks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage own personal records" on public.personal_records;
create policy "users manage own personal records"
  on public.personal_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===== Seed: full exercise library =====

insert into public.exercises
(name, category, muscle_primary, muscle_secondary, equipment_required, difficulty, animation_key, met)
values
('Barbell Back Squat','strength','{"quads","glutes"}'::text[],'{"hamstrings","core","lower_back"}'::text[],'{"barbell","rack"}'::text[],'intermediate','squat',6.0),
('Goblet Squat','strength','{"quads","glutes"}'::text[],'{"core"}'::text[],'{"dumbbells"}'::text[],'beginner','squat',5.0),
('Air Squat','strength','{"quads","glutes"}'::text[],'{"core"}'::text[],'{}'::text[],'beginner','squat',4.0),
('Romanian Deadlift','strength','{"hamstrings","glutes"}'::text[],'{"lower_back","core"}'::text[],'{"barbell"}'::text[],'intermediate','deadlift',5.5),
('Conventional Deadlift','strength','{"hamstrings","glutes","lower_back"}'::text[],'{"quads","traps","core"}'::text[],'{"barbell"}'::text[],'advanced','deadlift',7.0),
('Barbell Hip Thrust','strength','{"glutes"}'::text[],'{"hamstrings","core"}'::text[],'{"barbell","bench"}'::text[],'intermediate','hipThrust',5.0),
('Glute Bridge','strength','{"glutes"}'::text[],'{"hamstrings"}'::text[],'{}'::text[],'beginner','hipThrust',3.5),
('Barbell Bench Press','strength','{"chest"}'::text[],'{"triceps","front_delts"}'::text[],'{"barbell","bench"}'::text[],'intermediate','benchPress',5.5),
('Dumbbell Bench Press','strength','{"chest"}'::text[],'{"triceps","front_delts"}'::text[],'{"dumbbells","bench"}'::text[],'beginner','benchPress',5.0),
('Overhead Barbell Press','strength','{"front_delts","side_delts"}'::text[],'{"triceps","upper_chest","core"}'::text[],'{"barbell"}'::text[],'intermediate','shoulderPress',5.5),
('Dumbbell Shoulder Press','strength','{"front_delts"}'::text[],'{"triceps","side_delts"}'::text[],'{"dumbbells"}'::text[],'beginner','shoulderPress',5.0),
('Pull-up','strength','{"lats","biceps"}'::text[],'{"rhomboids","rear_delts"}'::text[],'{"pullup_bar"}'::text[],'intermediate','pullup',8.0),
('Chin-up','strength','{"biceps","lats"}'::text[],'{"rhomboids"}'::text[],'{"pullup_bar"}'::text[],'intermediate','pullup',7.5),
('Assisted Pull-up','strength','{"lats","biceps"}'::text[],'{"rhomboids"}'::text[],'{"pullup_bar"}'::text[],'beginner','pullup',6.0),
('Barbell Bicep Curl','strength','{"biceps"}'::text[],'{"forearms"}'::text[],'{"barbell"}'::text[],'beginner','bicepCurl',3.5),
('Dumbbell Bicep Curl','strength','{"biceps"}'::text[],'{"forearms"}'::text[],'{"dumbbells"}'::text[],'beginner','bicepCurl',3.5),
('Hammer Curl','strength','{"biceps","brachialis"}'::text[],'{"forearms"}'::text[],'{"dumbbells"}'::text[],'beginner','bicepCurl',3.5),
('Tricep Dip','strength','{"triceps"}'::text[],'{"chest","front_delts"}'::text[],'{"bench"}'::text[],'beginner','tricepDip',4.5),
('Parallel Bar Dip','strength','{"triceps","chest"}'::text[],'{"front_delts"}'::text[],'{"parallel_bars"}'::text[],'intermediate','tricepDip',6.0),
('Lateral Raise','strength','{"side_delts"}'::text[],'{"traps"}'::text[],'{"dumbbells"}'::text[],'beginner','lateralRaise',3.0),
('Front Raise','strength','{"front_delts"}'::text[],'{"core"}'::text[],'{"dumbbells"}'::text[],'beginner','lateralRaise',3.0),
('Face Pull','strength','{"rear_delts","rhomboids"}'::text[],'{"rotator_cuff"}'::text[],'{"cable"}'::text[],'beginner','lateralRaise',3.5),
('Forward Lunge','strength','{"quads","glutes"}'::text[],'{"hamstrings","calves","core"}'::text[],'{}'::text[],'beginner','lunge',4.5),
('Reverse Lunge','strength','{"quads","glutes"}'::text[],'{"hamstrings"}'::text[],'{}'::text[],'beginner','lunge',4.5),
('Bulgarian Split Squat','strength','{"quads","glutes"}'::text[],'{"hamstrings","core"}'::text[],'{"dumbbells","bench"}'::text[],'intermediate','lunge',5.5),
('Leg Press','strength','{"quads","glutes"}'::text[],'{"hamstrings"}'::text[],'{"leg_press"}'::text[],'beginner','squat',5.0),
('Leg Curl','strength','{"hamstrings"}'::text[],'{}'::text[],'{"leg_curl"}'::text[],'beginner','deadlift',3.5),
('Standing Calf Raise','strength','{"calves"}'::text[],'{}'::text[],'{}'::text[],'beginner','calfRaise',3.0),
('Wall Sit','strength','{"quads"}'::text[],'{"glutes","core"}'::text[],'{}'::text[],'beginner','squat',4.0),
('Push-up','strength','{"chest","triceps"}'::text[],'{"front_delts","core"}'::text[],'{}'::text[],'beginner','pushup',5.5),
('Wide Push-up','strength','{"chest"}'::text[],'{"triceps","front_delts"}'::text[],'{}'::text[],'beginner','pushup',5.5),
('Diamond Push-up','strength','{"triceps","inner_chest"}'::text[],'{"core"}'::text[],'{}'::text[],'intermediate','pushup',6.0),
('Pike Push-up','strength','{"front_delts"}'::text[],'{"triceps"}'::text[],'{}'::text[],'beginner','pushup',5.0),
('Inverted Row','strength','{"lats","rhomboids"}'::text[],'{"biceps","rear_delts"}'::text[],'{"barbell","rack"}'::text[],'beginner','pullup',5.5),
('Plank','core','{"core","transverse_abdominis"}'::text[],'{"shoulders","glutes"}'::text[],'{}'::text[],'beginner','plank',3.5),
('Side Plank','core','{"obliques","core"}'::text[],'{"glutes","shoulders"}'::text[],'{}'::text[],'beginner','plank',3.5),
('Crunch','core','{"upper_abs"}'::text[],'{}'::text[],'{}'::text[],'beginner','crunch',3.5),
('Bicycle Crunch','core','{"obliques","upper_abs"}'::text[],'{}'::text[],'{}'::text[],'beginner','crunch',4.5),
('Lying Leg Raise','core','{"lower_abs","hip_flexors"}'::text[],'{"core"}'::text[],'{}'::text[],'beginner','legRaise',4.0),
('Hanging Leg Raise','core','{"lower_abs","hip_flexors"}'::text[],'{"lats","core"}'::text[],'{"pullup_bar"}'::text[],'intermediate','legRaise',5.5),
('Russian Twist','core','{"obliques"}'::text[],'{"core"}'::text[],'{}'::text[],'beginner','russianTwist',4.0),
('Ab Wheel Rollout','core','{"core","transverse_abdominis"}'::text[],'{"lats","shoulders"}'::text[],'{"ab_wheel"}'::text[],'intermediate','plank',5.0),
('Dead Bug','core','{"core","transverse_abdominis"}'::text[],'{"hip_flexors"}'::text[],'{}'::text[],'beginner','legRaise',3.0),
('Burpee','hiit','{"full_body"}'::text[],'{}'::text[],'{}'::text[],'intermediate','burpee',10.0),
('Jumping Jack','cardio','{"full_body"}'::text[],'{}'::text[],'{}'::text[],'beginner','jumpingJack',7.0),
('High Knees','cardio','{"hip_flexors","calves"}'::text[],'{"core"}'::text[],'{}'::text[],'beginner','highKnees',8.0),
('Mountain Climber','hiit','{"core","hip_flexors"}'::text[],'{"shoulders","quads"}'::text[],'{}'::text[],'beginner','mountainClimber',8.0),
('Box Jump','hiit','{"quads","glutes"}'::text[],'{"calves","core"}'::text[],'{"plyo_box"}'::text[],'intermediate','squat',10.0),
('Jump Squat','hiit','{"quads","glutes"}'::text[],'{"calves","core"}'::text[],'{}'::text[],'intermediate','squat',9.0),
('Sprint (Treadmill)','cardio','{"quads","hamstrings"}'::text[],'{"glutes","calves","core"}'::text[],'{"treadmill"}'::text[],'intermediate','highKnees',14.0),
('Rowing Machine','cardio','{"back","legs"}'::text[],'{"core","arms"}'::text[],'{"rowing_machine"}'::text[],'beginner','pullup',7.0),
('Cycling','cardio','{"quads","hamstrings"}'::text[],'{"calves","glutes"}'::text[],'{"cycle_machine"}'::text[],'beginner','squat',8.0),
('Jump Rope','cardio','{"calves","shoulders"}'::text[],'{"core","coordination"}'::text[],'{"jump_rope"}'::text[],'beginner','jumpingJack',12.0),
('Hip Flexor Stretch','flexibility','{"hip_flexors"}'::text[],'{}'::text[],'{}'::text[],'beginner','lunge',2.0),
('Hamstring Stretch','flexibility','{"hamstrings"}'::text[],'{}'::text[],'{}'::text[],'beginner','deadlift',2.0),
('Pigeon Pose','flexibility','{"glutes","hip_flexors"}'::text[],'{}'::text[],'{}'::text[],'beginner','lunge',2.0),
('Child''s Pose','flexibility','{"lower_back","lats"}'::text[],'{}'::text[],'{}'::text[],'beginner','plank',1.5),
('Foam Roll Quads','recovery','{"quads"}'::text[],'{}'::text[],'{"foam_roller"}'::text[],'beginner','plank',2.5),
('Foam Roll IT Band','recovery','{"it_band"}'::text[],'{"outer_quads"}'::text[],'{"foam_roller"}'::text[],'beginner','plank',2.5),
('Box Step-up','sport','{"quads","glutes"}'::text[],'{"calves","core"}'::text[],'{"plyo_box"}'::text[],'beginner','lunge',5.5),
('Broad Jump','sport','{"quads","glutes","calves"}'::text[],'{"core"}'::text[],'{}'::text[],'intermediate','squat',9.0),
('Lateral Bound','sport','{"glutes","adductors"}'::text[],'{"calves","core"}'::text[],'{}'::text[],'intermediate','jumpingJack',8.0),
('Medicine Ball Slam','sport','{"core","shoulders"}'::text[],'{"triceps","lats"}'::text[],'{"medicine_ball"}'::text[],'intermediate','shoulderPress',8.5)
on conflict (lower(name)) do update set
  category = excluded.category,
  muscle_primary = excluded.muscle_primary,
  muscle_secondary = excluded.muscle_secondary,
  equipment_required = excluded.equipment_required,
  difficulty = excluded.difficulty,
  animation_key = excluded.animation_key,
  met = excluded.met,
  updated_at = now();

-- ===== Seed: workout templates =====

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Lower Body Power',
  'Athletic lower-body strength session built for power output, controlled depth, and posterior-chain force.',
  'strength',
  'sets_reps',
  'intermediate',
  45,
  450,
  '{"quads","glutes","hamstrings","core"}'::text[],
  '{"barbell","rack","bench"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Barbell Back Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Back Squat') limit 1),'sets',4,'reps','8-10','rest_seconds',90,'order',1,'cue','Chest tall, knees track over toes','modification',null,'suggested_load','60-80% 1RM'),
    jsonb_build_object('exercise_name','Romanian Deadlift','exercise_id',(select id from public.exercises where lower(name)=lower('Romanian Deadlift') limit 1),'sets',4,'reps','8','rest_seconds',90,'order',2,'cue','Hinge at the hips, keep spine neutral','modification',null,'suggested_load','55-75% 1RM'),
    jsonb_build_object('exercise_name','Forward Lunge','exercise_id',(select id from public.exercises where lower(name)=lower('Forward Lunge') limit 1),'sets',3,'reps','10/leg','rest_seconds',60,'order',3,'cue','Step long and stay balanced','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Barbell Hip Thrust','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Hip Thrust') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',4,'cue','Drive through heels, full lockout','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Standing Calf Raise','exercise_id',(select id from public.exercises where lower(name)=lower('Standing Calf Raise') limit 1),'sets',3,'reps','15','rest_seconds',45,'order',5,'cue','Pause one second at the top','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Plank') limit 1),'sets',3,'reps','45s','rest_seconds',30,'order',6,'cue','Brace the core, hips level','modification',null,'suggested_load',null)
  ),
  true,
  'mofitness',
  4.8,
  842,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Upper Push Volume',
  'Chest, shoulders, and triceps hypertrophy with progressive pressing volume and controlled tempo.',
  'strength',
  'sets_reps',
  'intermediate',
  42,
  390,
  '{"chest","shoulders","arms"}'::text[],
  '{"barbell","bench","dumbbells"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Barbell Bench Press','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Bench Press') limit 1),'sets',4,'reps','8','rest_seconds',90,'order',1,'cue','Control descent, explode up','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dumbbell Shoulder Press','exercise_id',(select id from public.exercises where lower(name)=lower('Dumbbell Shoulder Press') limit 1),'sets',3,'reps','10','rest_seconds',75,'order',2,'cue','Stack ribs down under the bar','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Push-up','exercise_id',(select id from public.exercises where lower(name)=lower('Push-up') limit 1),'sets',3,'reps','AMRAP','rest_seconds',60,'order',3,'cue','Keep body rigid as one line','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Lateral Raise','exercise_id',(select id from public.exercises where lower(name)=lower('Lateral Raise') limit 1),'sets',3,'reps','12','rest_seconds',45,'order',4,'cue','Lift with elbows, not wrists','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Tricep Dip','exercise_id',(select id from public.exercises where lower(name)=lower('Tricep Dip') limit 1),'sets',3,'reps','12','rest_seconds',45,'order',5,'cue','Shoulders down, elbows tucked','modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.7,
  623,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Back And Pull Strength',
  'Posterior-chain and upper-back pulling session to improve strength and posture under load.',
  'strength',
  'sets_reps',
  'intermediate',
  44,
  410,
  '{"back","arms","core"}'::text[],
  '{"barbell","rack","pullup_bar"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Conventional Deadlift','exercise_id',(select id from public.exercises where lower(name)=lower('Conventional Deadlift') limit 1),'sets',4,'reps','5','rest_seconds',120,'order',1,'cue','Push floor away, keep lats tight','modification',null,'suggested_load','70-85% 1RM'),
    jsonb_build_object('exercise_name','Pull-up','exercise_id',(select id from public.exercises where lower(name)=lower('Pull-up') limit 1),'sets',4,'reps','6-8','rest_seconds',90,'order',2,'cue','Pull elbows to pockets','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Inverted Row','exercise_id',(select id from public.exercises where lower(name)=lower('Inverted Row') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',3,'cue','Pause at the top','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Barbell Bicep Curl','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Bicep Curl') limit 1),'sets',3,'reps','12','rest_seconds',45,'order',4,'cue','Keep elbows fixed','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Face Pull','exercise_id',(select id from public.exercises where lower(name)=lower('Face Pull') limit 1),'sets',3,'reps','15','rest_seconds',45,'order',5,'cue','Lead with elbows, squeeze rear delts','modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.6,
  401,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Core Control 20',
  '20-minute core stability circuit targeting anti-extension, rotation, and lower-ab strength.',
  'core',
  'circuit',
  'beginner',
  20,
  190,
  '{"core","full_body"}'::text[],
  '{}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Plank') limit 1),'sets',3,'reps','45s','rest_seconds',20,'order',1,'cue','Press forearms down and brace','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Side Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Side Plank') limit 1),'sets',3,'reps','30s/side','rest_seconds',20,'order',2,'cue','Keep hips stacked','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Russian Twist','exercise_id',(select id from public.exercises where lower(name)=lower('Russian Twist') limit 1),'sets',3,'reps','20','rest_seconds',20,'order',3,'cue','Rotate from ribcage','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Lying Leg Raise','exercise_id',(select id from public.exercises where lower(name)=lower('Lying Leg Raise') limit 1),'sets',3,'reps','12','rest_seconds',30,'order',4,'cue','Lower slowly with control','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dead Bug','exercise_id',(select id from public.exercises where lower(name)=lower('Dead Bug') limit 1),'sets',3,'reps','10/side','rest_seconds',20,'order',5,'cue','Keep low back glued to floor','modification',null,'suggested_load',null)
  ),
  true,
  'mofitness',
  4.5,
  1248,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'HIIT Blast 15',
  'High-intensity intervals for conditioning and calorie burn in under 15 minutes.',
  'hiit',
  'tabata',
  'intermediate',
  15,
  230,
  '{"full_body","core","calves"}'::text[],
  '{}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Burpee','exercise_id',(select id from public.exercises where lower(name)=lower('Burpee') limit 1),'sets',8,'reps','20s','rest_seconds',10,'order',1,'cue','Land soft and stay explosive','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Mountain Climber','exercise_id',(select id from public.exercises where lower(name)=lower('Mountain Climber') limit 1),'sets',8,'reps','20s','rest_seconds',10,'order',2,'cue','Drive knees fast, shoulders over wrists','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','High Knees','exercise_id',(select id from public.exercises where lower(name)=lower('High Knees') limit 1),'sets',8,'reps','20s','rest_seconds',10,'order',3,'cue','Tall posture, quick contacts','modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Jumping Jack','exercise_id',(select id from public.exercises where lower(name)=lower('Jumping Jack') limit 1),'sets',8,'reps','20s','rest_seconds',10,'order',4,'cue','Snap arms and feet in sync','modification',null,'suggested_load',null)
  ),
  true,
  'mofitness',
  4.7,
  1602,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'No Equipment Quick 12',
  'Fast bodyweight finisher for busy days with no gear and minimal setup.',
  'strength',
  'circuit',
  'beginner',
  12,
  145,
  '{"full_body","core","quads"}'::text[],
  '{}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Air Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Air Squat') limit 1),'sets',3,'reps','15','rest_seconds',20,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Push-up','exercise_id',(select id from public.exercises where lower(name)=lower('Push-up') limit 1),'sets',3,'reps','10','rest_seconds',20,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Forward Lunge','exercise_id',(select id from public.exercises where lower(name)=lower('Forward Lunge') limit 1),'sets',3,'reps','10/leg','rest_seconds',20,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Plank') limit 1),'sets',3,'reps','30s','rest_seconds',20,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Jumping Jack','exercise_id',(select id from public.exercises where lower(name)=lower('Jumping Jack') limit 1),'sets',3,'reps','30s','rest_seconds',20,'order',5,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.4,
  2201,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Recovery Reset',
  'Low-impact mobility and tissue reset to reduce stiffness and promote recovery.',
  'recovery',
  'timed',
  'beginner',
  22,
  90,
  '{"glutes","hamstrings","core"}'::text[],
  '{"foam_roller"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Hip Flexor Stretch','exercise_id',(select id from public.exercises where lower(name)=lower('Hip Flexor Stretch') limit 1),'sets',2,'reps','45s/side','rest_seconds',20,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Hamstring Stretch','exercise_id',(select id from public.exercises where lower(name)=lower('Hamstring Stretch') limit 1),'sets',2,'reps','45s','rest_seconds',20,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Pigeon Pose','exercise_id',(select id from public.exercises where lower(name)=lower('Pigeon Pose') limit 1),'sets',2,'reps','45s/side','rest_seconds',20,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Child''s Pose','exercise_id',(select id from public.exercises where lower(name)=lower('Child''s Pose') limit 1),'sets',2,'reps','60s','rest_seconds',20,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Foam Roll Quads','exercise_id',(select id from public.exercises where lower(name)=lower('Foam Roll Quads') limit 1),'sets',2,'reps','60s','rest_seconds',20,'order',5,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Foam Roll IT Band','exercise_id',(select id from public.exercises where lower(name)=lower('Foam Roll IT Band') limit 1),'sets',2,'reps','45s/side','rest_seconds',20,'order',6,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.9,
  918,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Cardio Rush',
  'Steady cardio block with rising pace to keep heart rate in the training zone.',
  'cardio',
  'for_time',
  'beginner',
  30,
  320,
  '{"full_body","calves","quads"}'::text[],
  '{"treadmill"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Sprint (Treadmill)','exercise_id',(select id from public.exercises where lower(name)=lower('Sprint (Treadmill)') limit 1),'sets',5,'reps','90s','rest_seconds',60,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','High Knees','exercise_id',(select id from public.exercises where lower(name)=lower('High Knees') limit 1),'sets',4,'reps','45s','rest_seconds',30,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Jump Rope','exercise_id',(select id from public.exercises where lower(name)=lower('Jump Rope') limit 1),'sets',4,'reps','60s','rest_seconds',30,'order',3,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.3,
  557,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Sport Explosive Power',
  'Plyometric sport prep for acceleration, lateral force, and reactive jump quality.',
  'sport',
  'circuit',
  'intermediate',
  35,
  360,
  '{"quads","glutes","calves","core"}'::text[],
  '{"plyo_box","medicine_ball"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Box Step-up','exercise_id',(select id from public.exercises where lower(name)=lower('Box Step-up') limit 1),'sets',3,'reps','10/leg','rest_seconds',45,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Broad Jump','exercise_id',(select id from public.exercises where lower(name)=lower('Broad Jump') limit 1),'sets',4,'reps','6','rest_seconds',60,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Lateral Bound','exercise_id',(select id from public.exercises where lower(name)=lower('Lateral Bound') limit 1),'sets',4,'reps','8/side','rest_seconds',45,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Medicine Ball Slam','exercise_id',(select id from public.exercises where lower(name)=lower('Medicine Ball Slam') limit 1),'sets',4,'reps','10','rest_seconds',45,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Jump Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Jump Squat') limit 1),'sets',3,'reps','10','rest_seconds',45,'order',5,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.8,
  384,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Beginner Foundation',
  'Entry-level full-body strength workout focused on pattern quality and confidence.',
  'strength',
  'sets_reps',
  'beginner',
  32,
  260,
  '{"full_body","core","glutes"}'::text[],
  '{"dumbbells"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Goblet Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Goblet Squat') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dumbbell Bench Press','exercise_id',(select id from public.exercises where lower(name)=lower('Dumbbell Bench Press') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dumbbell Shoulder Press','exercise_id',(select id from public.exercises where lower(name)=lower('Dumbbell Shoulder Press') limit 1),'sets',3,'reps','10','rest_seconds',60,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Reverse Lunge','exercise_id',(select id from public.exercises where lower(name)=lower('Reverse Lunge') limit 1),'sets',3,'reps','8/leg','rest_seconds',45,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Dumbbell Bicep Curl','exercise_id',(select id from public.exercises where lower(name)=lower('Dumbbell Bicep Curl') limit 1),'sets',2,'reps','12','rest_seconds',45,'order',5,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Plank') limit 1),'sets',2,'reps','30s','rest_seconds',30,'order',6,'cue',null,'modification',null,'suggested_load',null)
  ),
  true,
  'mofitness',
  4.9,
  1467,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Beast Mode Strength',
  'Advanced heavy lifting split with lower volume but high intensity for strength peaks.',
  'strength',
  'sets_reps',
  'advanced',
  55,
  520,
  '{"full_body","back","quads"}'::text[],
  '{"barbell","rack","bench","pullup_bar"}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Barbell Back Squat','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Back Squat') limit 1),'sets',5,'reps','5','rest_seconds',120,'order',1,'cue',null,'modification',null,'suggested_load','75-88% 1RM'),
    jsonb_build_object('exercise_name','Conventional Deadlift','exercise_id',(select id from public.exercises where lower(name)=lower('Conventional Deadlift') limit 1),'sets',4,'reps','4','rest_seconds',150,'order',2,'cue',null,'modification',null,'suggested_load','80-90% 1RM'),
    jsonb_build_object('exercise_name','Barbell Bench Press','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Bench Press') limit 1),'sets',5,'reps','5','rest_seconds',120,'order',3,'cue',null,'modification',null,'suggested_load','75-85% 1RM'),
    jsonb_build_object('exercise_name','Pull-up','exercise_id',(select id from public.exercises where lower(name)=lower('Pull-up') limit 1),'sets',4,'reps','AMRAP','rest_seconds',90,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Barbell Hip Thrust','exercise_id',(select id from public.exercises where lower(name)=lower('Barbell Hip Thrust') limit 1),'sets',3,'reps','8','rest_seconds',90,'order',5,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.6,
  288,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();

insert into public.workout_templates
(name, description, category, format, difficulty, duration_minutes, calories_estimate, muscle_groups, equipment, exercises, is_featured, created_by, rating_avg, times_completed, created_at)
values (
  'Flexibility Flow',
  'Mobility and stretch flow to improve hip opening, thoracic movement, and downregulation.',
  'flexibility',
  'timed',
  'beginner',
  18,
  70,
  '{"hamstrings","glutes","core"}'::text[],
  '{}'::text[],
  jsonb_build_array(
    jsonb_build_object('exercise_name','Hip Flexor Stretch','exercise_id',(select id from public.exercises where lower(name)=lower('Hip Flexor Stretch') limit 1),'sets',2,'reps','40s/side','rest_seconds',15,'order',1,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Hamstring Stretch','exercise_id',(select id from public.exercises where lower(name)=lower('Hamstring Stretch') limit 1),'sets',2,'reps','40s','rest_seconds',15,'order',2,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Pigeon Pose','exercise_id',(select id from public.exercises where lower(name)=lower('Pigeon Pose') limit 1),'sets',2,'reps','40s/side','rest_seconds',15,'order',3,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Child''s Pose','exercise_id',(select id from public.exercises where lower(name)=lower('Child''s Pose') limit 1),'sets',2,'reps','60s','rest_seconds',15,'order',4,'cue',null,'modification',null,'suggested_load',null),
    jsonb_build_object('exercise_name','Side Plank','exercise_id',(select id from public.exercises where lower(name)=lower('Side Plank') limit 1),'sets',2,'reps','30s/side','rest_seconds',15,'order',5,'cue',null,'modification',null,'suggested_load',null)
  ),
  false,
  'mofitness',
  4.5,
  733,
  '2026-03-15T00:00:00.000Z'::timestamptz
)
on conflict (lower(name)) do update set
  description = excluded.description,
  category = excluded.category,
  format = excluded.format,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  calories_estimate = excluded.calories_estimate,
  muscle_groups = excluded.muscle_groups,
  equipment = excluded.equipment,
  exercises = excluded.exercises,
  is_featured = excluded.is_featured,
  rating_avg = excluded.rating_avg,
  times_completed = excluded.times_completed,
  updated_at = now();


-- ===== Seed: built-in playlists (starter, replace paths with real storage objects) =====
insert into public.playlist_tracks (playlist_id, title, artist, duration_s, storage_path, bpm, mood, order_idx)
values
  ('beast_mode','Rise Up','Mo Audio',192,'playlist/beast_mode/rise_up.mp3',142,'high_energy',1),
  ('beast_mode','Iron Pulse','Mo Audio',204,'playlist/beast_mode/iron_pulse.mp3',148,'high_energy',2),
  ('beast_mode','No Brake','Mo Audio',188,'playlist/beast_mode/no_brake.mp3',146,'high_energy',3),
  ('afrobeats_lift','Shine Tempo','Mo Audio',210,'playlist/afrobeats_lift/shine_tempo.mp3',118,'uplifting',1),
  ('afrobeats_lift','City Groove','Mo Audio',198,'playlist/afrobeats_lift/city_groove.mp3',112,'uplifting',2),
  ('afrobeats_lift','Lift Wave','Mo Audio',220,'playlist/afrobeats_lift/lift_wave.mp3',115,'uplifting',3),
  ('focus_zone','Still Drive','Mo Audio',240,'playlist/focus_zone/still_drive.mp3',95,'focus',1),
  ('focus_zone','Clean Set','Mo Audio',226,'playlist/focus_zone/clean_set.mp3',92,'focus',2),
  ('focus_zone','Deep Form','Mo Audio',232,'playlist/focus_zone/deep_form.mp3',90,'focus',3),
  ('cardio_rush','Neon Sprint','Mo Audio',176,'playlist/cardio_rush/neon_sprint.mp3',132,'cardio',1),
  ('cardio_rush','Peak Zone','Mo Audio',182,'playlist/cardio_rush/peak_zone.mp3',136,'cardio',2),
  ('cardio_rush','Pulse Runner','Mo Audio',174,'playlist/cardio_rush/pulse_runner.mp3',138,'cardio',3),
  ('morning_energy','Sun Up','Mo Audio',206,'playlist/morning_energy/sun_up.mp3',124,'upbeat',1),
  ('morning_energy','Fresh Start','Mo Audio',214,'playlist/morning_energy/fresh_start.mp3',122,'upbeat',2),
  ('morning_energy','Move Early','Mo Audio',200,'playlist/morning_energy/move_early.mp3',120,'upbeat',3),
  ('recovery_vibes','Cool Down Drift','Mo Audio',230,'playlist/recovery_vibes/cool_down_drift.mp3',88,'calm',1),
  ('recovery_vibes','Night Stretch','Mo Audio',244,'playlist/recovery_vibes/night_stretch.mp3',84,'calm',2),
  ('recovery_vibes','Slow Breath','Mo Audio',252,'playlist/recovery_vibes/slow_breath.mp3',80,'calm',3)
on conflict do nothing;

commit;
