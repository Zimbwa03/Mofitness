begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop index if exists public.ux_country_cuisines_country_code;

create index if not exists idx_feed_posts_user on public.feed_posts(user_id);
create index if not exists idx_feed_comments_user on public.feed_comments(user_id);
create index if not exists idx_feed_comments_parent on public.feed_comments(parent_comment_id);
create index if not exists idx_meal_logs_feed_post on public.meal_logs(feed_post_id) where feed_post_id is not null;

drop policy if exists "users manage own feed posts" on public.feed_posts;
create policy "users insert own feed posts"
  on public.feed_posts for insert
  with check (auth.uid() = user_id);
create policy "users update own feed posts"
  on public.feed_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "users delete own feed posts"
  on public.feed_posts for delete
  using (auth.uid() = user_id);

drop policy if exists "users manage own feed likes" on public.feed_likes;
create policy "users insert own feed likes"
  on public.feed_likes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.feed_posts p
      where p.id = post_id
        and p.is_visible = true
    )
  );
create policy "users delete own feed likes"
  on public.feed_likes for delete
  using (auth.uid() = user_id);

drop policy if exists "users manage own feed ratings" on public.feed_ratings;
create policy "users insert own feed ratings"
  on public.feed_ratings for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.feed_posts p
      where p.id = post_id
        and p.is_visible = true
    )
  );
create policy "users update own feed ratings"
  on public.feed_ratings for update
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
create policy "users delete own feed ratings"
  on public.feed_ratings for delete
  using (auth.uid() = user_id);

commit;
