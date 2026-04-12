create extension if not exists pgcrypto;

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lyrics text not null,
  musical_key text not null default '',
  category text,
  tags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.setlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date timestamptz not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.setlist_songs (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position integer not null,
  unique (setlist_id, position)
);

create index if not exists songs_title_idx on public.songs(title);
create index if not exists songs_lyrics_idx on public.songs using gin (to_tsvector('simple', lyrics));
create index if not exists setlist_songs_setlist_idx on public.setlist_songs(setlist_id);

create or replace function public.handle_song_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists songs_updated_at on public.songs;
create trigger songs_updated_at
before update on public.songs
for each row
execute function public.handle_song_updated_at();

alter table public.songs enable row level security;
alter table public.setlists enable row level security;
alter table public.setlist_songs enable row level security;

drop policy if exists "public can manage songs" on public.songs;
drop policy if exists "authenticated users can manage songs" on public.songs;
create policy "public can manage songs"
on public.songs
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public can manage setlists" on public.setlists;
drop policy if exists "authenticated users can manage setlists" on public.setlists;
create policy "public can manage setlists"
on public.setlists
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public can manage setlist songs" on public.setlist_songs;
drop policy if exists "authenticated users can manage setlist songs" on public.setlist_songs;
create policy "public can manage setlist songs"
on public.setlist_songs
for all
to anon, authenticated
using (true)
with check (true);
