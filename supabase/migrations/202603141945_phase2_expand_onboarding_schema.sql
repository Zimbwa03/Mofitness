alter table public.users
  add column if not exists height_cm numeric(5,1),
  add column if not exists weight_kg numeric(5,1),
  add column if not exists body_fat_pct numeric(4,1),
  add column if not exists experience_level text not null default 'beginner',
  add column if not exists goals text[] not null default '{}',
  add column if not exists activity_level text;

alter table public.users
  drop constraint if exists users_experience_level_check,
  add constraint users_experience_level_check
    check (experience_level in ('beginner', 'intermediate', 'advanced'));

alter table public.users
  drop constraint if exists users_activity_level_check,
  add constraint users_activity_level_check
    check (activity_level in ('sedentary', 'lightly_active', 'active', 'highly_active'));

alter table public.preferences
  add column if not exists training_days_per_week integer,
  add column if not exists available_equipment text[] not null default '{}',
  add column if not exists preferred_workout_time text,
  add column if not exists dietary_restrictions text[] not null default '{}',
  add column if not exists medical_conditions text not null default '',
  add column if not exists activity_type text,
  add column if not exists sport_focus text not null default '',
  add column if not exists interest_in_mindfulness boolean not null default false,
  add column if not exists wants_challenges boolean not null default true,
  add column if not exists has_wearable boolean not null default false;

alter table public.preferences
  drop constraint if exists preferences_training_days_per_week_check,
  add constraint preferences_training_days_per_week_check
    check (training_days_per_week between 1 and 7 or training_days_per_week is null);

alter table public.preferences
  drop constraint if exists preferences_preferred_workout_time_check,
  add constraint preferences_preferred_workout_time_check
    check (preferred_workout_time in ('morning', 'afternoon', 'evening') or preferred_workout_time is null);

alter table public.preferences
  drop constraint if exists preferences_activity_type_check,
  add constraint preferences_activity_type_check
    check (activity_type in ('strength', 'cardio', 'flexibility', 'mixed') or activity_type is null);
