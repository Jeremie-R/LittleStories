-- Little Stories: tables, row-level security and photo storage.
-- Paste this whole file into the Supabase dashboard (SQL Editor → New query → Run). Safe to re-run.
--
-- Each person and story is stored as a JSON document (the app's own types in src/lib/types.ts),
-- so adding a field to the app never needs a migration here.

create table if not exists public.people (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.stories (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- "You": the notes you keep about yourself.
create table if not exists public.profiles (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Nobody reaches the journal without signing in. Signed-in users get row access through the
-- API, limited to their own rows by the policies below. (Supabase's defaults grant more.)
revoke all on table public.people, public.stories, public.profiles from anon, authenticated;
grant select, insert, update, delete on table public.people, public.stories, public.profiles to authenticated;

alter table public.people enable row level security;
alter table public.stories enable row level security;
alter table public.profiles enable row level security;

-- Each person can only read and write their own journal.
drop policy if exists "own people" on public.people;
create policy "own people" on public.people for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own stories" on public.stories;
create policy "own stories" on public.stories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Photos: a private bucket, one folder per user (photos/{user id}/{photo id}).
-- The app compresses photos before upload (≈150–400 kB each); 2 MB is a safety cap.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "own photos: read" on storage.objects;
create policy "own photos: read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own photos: add" on storage.objects;
create policy "own photos: add" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own photos: replace" on storage.objects;
create policy "own photos: replace" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own photos: delete" on storage.objects;
create policy "own photos: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Make the API see the new tables straight away.
notify pgrst, 'reload schema';
