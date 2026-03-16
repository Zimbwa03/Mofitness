create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'coach')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  slug text not null unique,
  full_name text not null,
  email text not null unique,
  phone text,
  profile_photo_url text,
  cover_photo_url text,
  bio text not null,
  tagline text,
  country text not null,
  city text not null,
  address text,
  lat numeric(10,7),
  lng numeric(10,7),
  radius_km integer not null default 20,
  specialisations text[] not null default '{}',
  experience_years integer not null default 0,
  languages text[] not null default '{}',
  website_url text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  youtube_url text,
  session_types text[] not null default '{}',
  price_per_hour_usd numeric(8,2),
  currency text not null default 'USD',
  availability jsonb not null default '{}'::jsonb,
  package_summary text,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'under_review', 'approved', 'rejected', 'suspended', 'more_info_required')),
  verification_score integer check (verification_score between 0 and 100),
  application_submitted_at timestamptz,
  verified_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  admin_notes text,
  total_clients integer not null default 0,
  avg_rating numeric(3,2) not null default 0,
  total_reviews integer not null default 0,
  response_rate_pct integer not null default 100 check (response_rate_pct between 0 and 100),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_certifications (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  certification_name text not null,
  issuing_organisation text not null,
  year_obtained integer,
  certificate_number text,
  certificate_file_path text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_documents (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  document_type text not null
    check (document_type in ('government_id_front', 'government_id_back', 'proof_of_address', 'selfie_with_id', 'other')),
  file_name text,
  file_path text not null,
  mime_type text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_reviews (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  reviewer_id uuid references public.users(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  headline text,
  body text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.web_user_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  age integer,
  gender text,
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  bmi numeric(5,2),
  bmi_category text,
  bmr numeric(7,2),
  tdee numeric(7,2),
  ideal_weight_min_kg numeric(6,2),
  ideal_weight_max_kg numeric(6,2),
  daily_calorie_target integer,
  fitness_goal text,
  fitness_level text,
  injuries text[] not null default '{}',
  preferred_session text,
  budget_per_session_usd numeric(8,2),
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  city text,
  country text,
  travel_radius_km integer,
  send_results_by_email boolean not null default true,
  notify_new_coaches boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  web_profile_id uuid references public.web_user_profiles(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  match_source text not null default 'ai' check (match_source in ('ai', 'manual')),
  match_score numeric(5,2),
  match_reasons jsonb not null default '[]'::jsonb,
  concern_notes text,
  status text not null default 'suggested'
    check (status in ('suggested', 'contacted', 'active', 'completed', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_matches_actor_check check (
    user_id is not null or web_profile_id is not null
  )
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived', 'blocked')),
  last_message text,
  last_msg_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'coach', 'admin')),
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fitness_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  event_type text not null,
  cover_image_url text,
  gallery_urls text[] not null default '{}',
  venue_name text,
  address text,
  city text not null,
  country text not null,
  lat numeric(10,7),
  lng numeric(10,7),
  is_virtual boolean not null default false,
  virtual_link text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  registration_deadline timestamptz,
  capacity integer,
  spots_remaining integer,
  is_free boolean not null default false,
  price_usd numeric(8,2),
  stripe_price_id text,
  organiser_id uuid references public.users(id) on delete set null,
  difficulty_level text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.fitness_events(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_conditions text,
  tshirt_size text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded', 'free')),
  stripe_session text,
  stripe_payment_intent text,
  ticket_code text not null unique,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  registered_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  target_type text not null check (target_type in ('email', 'push')),
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_user_roles_role on public.user_roles(role);
create index if not exists idx_coaches_status on public.coaches(status);
create index if not exists idx_coaches_city_country on public.coaches(country, city);
create index if not exists idx_coaches_specialisations on public.coaches using gin (specialisations);
create index if not exists idx_coaches_session_types on public.coaches using gin (session_types);
create index if not exists idx_coaches_coordinates on public.coaches using gist (point(lng, lat)) where lat is not null and lng is not null;
create index if not exists idx_coach_certifications_coach on public.coach_certifications(coach_id);
create index if not exists idx_coach_documents_coach on public.coach_documents(coach_id);
create index if not exists idx_coach_reviews_coach on public.coach_reviews(coach_id, created_at desc);
create index if not exists idx_coach_matches_user on public.coach_matches(user_id, created_at desc);
create index if not exists idx_coach_matches_web_profile on public.coach_matches(web_profile_id, created_at desc);
create index if not exists idx_coach_matches_coach on public.coach_matches(coach_id, created_at desc);
create index if not exists idx_conversations_user on public.conversations(user_id, last_msg_at desc);
create index if not exists idx_conversations_coach on public.conversations(coach_id, last_msg_at desc);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);
create index if not exists idx_fitness_events_status on public.fitness_events(status, starts_at);
create index if not exists idx_event_registrations_event on public.event_registrations(event_id, registered_at desc);

create or replace function public.has_role(requested_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = requested_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

create or replace function public.is_coach_owner(target_coach_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.coaches
    where id = target_coach_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations conversation
    join public.coaches coach on coach.id = conversation.coach_id
    where conversation.id = target_conversation_id
      and (
        conversation.user_id = auth.uid()
        or coach.user_id = auth.uid()
      )
  );
$$;

create or replace function public.recalculate_coach_rating(target_coach_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_avg numeric(3,2);
  next_total integer;
begin
  select coalesce(round(avg(rating)::numeric, 2), 0), count(*)
    into next_avg, next_total
  from public.coach_reviews
  where coach_id = target_coach_id;

  update public.coaches
  set avg_rating = next_avg,
      total_reviews = next_total,
      updated_at = now()
  where id = target_coach_id;
end;
$$;

create or replace function public.handle_coach_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_coach_rating(coalesce(new.coach_id, old.coach_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.sync_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message = left(new.body, 140),
      last_msg_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create or replace function public.sync_event_spots_remaining()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event_id uuid;
begin
  target_event_id := coalesce(new.event_id, old.event_id);

  update public.fitness_events event_row
  set spots_remaining = case
    when event_row.capacity is null then null
    else greatest(
      event_row.capacity - (
        select count(*)
        from public.event_registrations registration
        where registration.event_id = target_event_id
          and registration.payment_status in ('paid', 'free', 'pending')
      ),
      0
    )
  end,
  updated_at = now()
  where event_row.id = target_event_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_coaches_updated_at on public.coaches;
create trigger trg_coaches_updated_at
before update on public.coaches
for each row execute function public.set_updated_at();

drop trigger if exists trg_coach_certifications_updated_at on public.coach_certifications;
create trigger trg_coach_certifications_updated_at
before update on public.coach_certifications
for each row execute function public.set_updated_at();

drop trigger if exists trg_coach_documents_updated_at on public.coach_documents;
create trigger trg_coach_documents_updated_at
before update on public.coach_documents
for each row execute function public.set_updated_at();

drop trigger if exists trg_coach_reviews_updated_at on public.coach_reviews;
create trigger trg_coach_reviews_updated_at
before update on public.coach_reviews
for each row execute function public.set_updated_at();

drop trigger if exists trg_web_user_profiles_updated_at on public.web_user_profiles;
create trigger trg_web_user_profiles_updated_at
before update on public.web_user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_coach_matches_updated_at on public.coach_matches;
create trigger trg_coach_matches_updated_at
before update on public.coach_matches
for each row execute function public.set_updated_at();

drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

drop trigger if exists trg_fitness_events_updated_at on public.fitness_events;
create trigger trg_fitness_events_updated_at
before update on public.fitness_events
for each row execute function public.set_updated_at();

drop trigger if exists trg_coach_reviews_recalc on public.coach_reviews;
create trigger trg_coach_reviews_recalc
after insert or update or delete on public.coach_reviews
for each row execute function public.handle_coach_review_change();

drop trigger if exists trg_messages_sync_conversation on public.messages;
create trigger trg_messages_sync_conversation
after insert on public.messages
for each row execute function public.sync_conversation_last_message();

drop trigger if exists trg_event_registrations_sync_spots on public.event_registrations;
create trigger trg_event_registrations_sync_spots
after insert or update or delete on public.event_registrations
for each row execute function public.sync_event_spots_remaining();

alter table public.user_roles enable row level security;
alter table public.coaches enable row level security;
alter table public.coach_certifications enable row level security;
alter table public.coach_documents enable row level security;
alter table public.coach_reviews enable row level security;
alter table public.web_user_profiles enable row level security;
alter table public.coach_matches enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.fitness_events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.notification_logs enable row level security;

drop policy if exists "user roles own read" on public.user_roles;
create policy "user roles own read"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "admins manage user roles" on public.user_roles;
create policy "admins manage user roles"
  on public.user_roles for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "public read approved coaches" on public.coaches;
create policy "public read approved coaches"
  on public.coaches for select
  using (status = 'approved' or auth.uid() = user_id or public.is_admin());

drop policy if exists "coach insert own profile" on public.coaches;
create policy "coach insert own profile"
  on public.coaches for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "coach update own profile" on public.coaches;
create policy "coach update own profile"
  on public.coaches for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "admins delete coaches" on public.coaches;
create policy "admins delete coaches"
  on public.coaches for delete
  using (public.is_admin());

drop policy if exists "coach certs owner read" on public.coach_certifications;
create policy "coach certs owner read"
  on public.coach_certifications for select
  using (public.is_coach_owner(coach_id) or public.is_admin());

drop policy if exists "coach certs owner insert" on public.coach_certifications;
create policy "coach certs owner insert"
  on public.coach_certifications for insert
  with check (public.is_coach_owner(coach_id) or public.is_admin());

drop policy if exists "coach certs owner update" on public.coach_certifications;
create policy "coach certs owner update"
  on public.coach_certifications for update
  using (public.is_coach_owner(coach_id) or public.is_admin())
  with check (public.is_coach_owner(coach_id) or public.is_admin());

drop policy if exists "coach docs owner read" on public.coach_documents;
create policy "coach docs owner read"
  on public.coach_documents for select
  using (public.is_coach_owner(coach_id) or public.is_admin());

drop policy if exists "coach docs owner insert" on public.coach_documents;
create policy "coach docs owner insert"
  on public.coach_documents for insert
  with check (public.is_coach_owner(coach_id) or public.is_admin());

drop policy if exists "coach docs owner update" on public.coach_documents;
create policy "coach docs owner update"
  on public.coach_documents for update
  using (public.is_coach_owner(coach_id) or public.is_admin())
  with check (public.is_coach_owner(coach_id) or public.is_admin());

drop policy if exists "public read coach reviews" on public.coach_reviews;
create policy "public read coach reviews"
  on public.coach_reviews for select
  using (true);

drop policy if exists "matched users write coach reviews" on public.coach_reviews;
create policy "matched users write coach reviews"
  on public.coach_reviews for insert
  with check (
    auth.role() = 'authenticated'
    and reviewer_id = auth.uid()
    and exists (
      select 1
      from public.coach_matches
      where coach_matches.coach_id = coach_reviews.coach_id
        and coach_matches.user_id = auth.uid()
        and coach_matches.status in ('active', 'completed')
    )
  );

drop policy if exists "review owners update own reviews" on public.coach_reviews;
create policy "review owners update own reviews"
  on public.coach_reviews for update
  using (reviewer_id = auth.uid() or public.is_admin())
  with check (reviewer_id = auth.uid() or public.is_admin());

drop policy if exists "review owners delete own reviews" on public.coach_reviews;
create policy "review owners delete own reviews"
  on public.coach_reviews for delete
  using (reviewer_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage web user profiles" on public.web_user_profiles;
create policy "admins manage web user profiles"
  on public.web_user_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "coach matches participant read" on public.coach_matches;
create policy "coach matches participant read"
  on public.coach_matches for select
  using (
    user_id = auth.uid()
    or public.is_coach_owner(coach_id)
    or public.is_admin()
  );

drop policy if exists "coach matches participant insert" on public.coach_matches;
create policy "coach matches participant insert"
  on public.coach_matches for insert
  with check (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "coach matches participant update" on public.coach_matches;
create policy "coach matches participant update"
  on public.coach_matches for update
  using (
    user_id = auth.uid()
    or public.is_coach_owner(coach_id)
    or public.is_admin()
  )
  with check (
    user_id = auth.uid()
    or public.is_coach_owner(coach_id)
    or public.is_admin()
  );

drop policy if exists "conversation participants read" on public.conversations;
create policy "conversation participants read"
  on public.conversations for select
  using (
    user_id = auth.uid()
    or public.is_coach_owner(coach_id)
    or public.is_admin()
  );

drop policy if exists "conversation participants insert" on public.conversations;
create policy "conversation participants insert"
  on public.conversations for insert
  with check (
    user_id = auth.uid()
    or public.is_coach_owner(coach_id)
    or public.is_admin()
  );

drop policy if exists "conversation participants update" on public.conversations;
create policy "conversation participants update"
  on public.conversations for update
  using (
    user_id = auth.uid()
    or public.is_coach_owner(coach_id)
    or public.is_admin()
  )
  with check (
    user_id = auth.uid()
    or public.is_coach_owner(coach_id)
    or public.is_admin()
  );

drop policy if exists "message participants read" on public.messages;
create policy "message participants read"
  on public.messages for select
  using (
    public.is_conversation_participant(conversation_id)
    or public.is_admin()
  );

drop policy if exists "message participants insert" on public.messages;
create policy "message participants insert"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and (public.is_conversation_participant(conversation_id) or public.is_admin())
  );

drop policy if exists "message participants update" on public.messages;
create policy "message participants update"
  on public.messages for update
  using (
    public.is_conversation_participant(conversation_id)
    or public.is_admin()
  )
  with check (
    public.is_conversation_participant(conversation_id)
    or public.is_admin()
  );

drop policy if exists "public read published events" on public.fitness_events;
create policy "public read published events"
  on public.fitness_events for select
  using (status = 'published' or public.is_admin());

drop policy if exists "admins manage events" on public.fitness_events;
create policy "admins manage events"
  on public.fitness_events for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "registration owners read" on public.event_registrations;
create policy "registration owners read"
  on public.event_registrations for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "authenticated registration insert" on public.event_registrations;
create policy "authenticated registration insert"
  on public.event_registrations for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage registrations" on public.event_registrations;
create policy "admins manage registrations"
  on public.event_registrations for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins read notification logs" on public.notification_logs;
create policy "admins read notification logs"
  on public.notification_logs for select
  using (public.is_admin());

drop policy if exists "admins write notification logs" on public.notification_logs;
create policy "admins write notification logs"
  on public.notification_logs for all
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('coach-profile-photos', 'coach-profile-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('event-media', 'event-media', true, 15728640, array['image/jpeg', 'image/png', 'image/webp']),
  ('coach-documents', 'coach-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "coach profile public read" on storage.objects;
create policy "coach profile public read"
  on storage.objects for select
  using (bucket_id = 'coach-profile-photos');

drop policy if exists "coach profile owner write" on storage.objects;
create policy "coach profile owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'coach-profile-photos'
    and (
      public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "coach profile owner update" on storage.objects;
create policy "coach profile owner update"
  on storage.objects for update
  using (
    bucket_id = 'coach-profile-photos'
    and (
      public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'coach-profile-photos'
    and (
      public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "coach profile owner delete" on storage.objects;
create policy "coach profile owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'coach-profile-photos'
    and (
      public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "event media public read" on storage.objects;
create policy "event media public read"
  on storage.objects for select
  using (bucket_id = 'event-media');

drop policy if exists "admins manage event media" on storage.objects;
create policy "admins manage event media"
  on storage.objects for insert
  with check (bucket_id = 'event-media' and public.is_admin());

drop policy if exists "admins update event media" on storage.objects;
create policy "admins update event media"
  on storage.objects for update
  using (bucket_id = 'event-media' and public.is_admin())
  with check (bucket_id = 'event-media' and public.is_admin());

drop policy if exists "admins delete event media" on storage.objects;
create policy "admins delete event media"
  on storage.objects for delete
  using (bucket_id = 'event-media' and public.is_admin());

drop policy if exists "coach docs owner read" on storage.objects;
create policy "coach docs owner read"
  on storage.objects for select
  using (
    bucket_id = 'coach-documents'
    and (
      public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "coach docs owner insert" on storage.objects;
create policy "coach docs owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'coach-documents'
    and (
      public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "coach docs owner update" on storage.objects;
create policy "coach docs owner update"
  on storage.objects for update
  using (
    bucket_id = 'coach-documents'
    and (
      public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'coach-documents'
    and (
      public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "coach docs owner delete" on storage.objects;
create policy "coach docs owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'coach-documents'
    and (
      public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'conversations'
    ) then
      alter publication supabase_realtime add table public.conversations;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;
  end if;
end $$;
