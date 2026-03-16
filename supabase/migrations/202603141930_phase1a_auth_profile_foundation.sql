create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  gender text check (gender in ('male','female','non_binary','prefer_not_to_say')),
  date_of_birth date,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.preferences enable row level security;

drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users can insert own profile" on public.users;
create policy "users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users can read own preferences" on public.preferences;
create policy "users can read own preferences"
  on public.preferences for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert own preferences" on public.preferences;
create policy "users can insert own preferences"
  on public.preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update own preferences" on public.preferences;
create policy "users can update own preferences"
  on public.preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
