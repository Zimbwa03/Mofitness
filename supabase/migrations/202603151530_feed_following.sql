create table if not exists public.user_follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint user_follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists idx_user_follows_following on public.user_follows(following_id, created_at desc);

alter table public.user_follows enable row level security;

drop policy if exists "authenticated read follows" on public.user_follows;
create policy "authenticated read follows"
  on public.user_follows for select
  to authenticated
  using (true);

drop policy if exists "users manage own follows" on public.user_follows;
create policy "users manage own follows"
  on public.user_follows for all
  to authenticated
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_follows'
  ) THEN
    NULL;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
