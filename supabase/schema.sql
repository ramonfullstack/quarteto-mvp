create extension if not exists pgcrypto;

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lyrics text not null,
  musical_key text not null default '',
  category text,
  tags text[] not null default '{}',
  audio_key text,
  audio_url text,
  audio_file_name text,
  audio_content_type text,
  audio_size_bytes bigint,
  audio_status text not null default 'none' check (audio_status in ('none', 'pending', 'uploaded', 'failed')),
  audio_error text,
  audio_uploaded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.songs
add column if not exists audio_key text,
add column if not exists audio_url text,
add column if not exists audio_file_name text,
add column if not exists audio_content_type text,
add column if not exists audio_size_bytes bigint,
add column if not exists audio_status text not null default 'none',
add column if not exists audio_error text,
add column if not exists audio_uploaded_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'songs_audio_status_check'
      and conrelid = 'public.songs'::regclass
  ) then
    alter table public.songs
    add constraint songs_audio_status_check
    check (audio_status in ('none', 'pending', 'uploaded', 'failed'));
  end if;
end
$$;

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

create table if not exists public.song_audio_files (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  slot_index integer not null,
  label text not null,
  audio_key text,
  audio_url text,
  audio_file_name text,
  audio_content_type text,
  audio_size_bytes bigint,
  audio_status text not null default 'none' check (audio_status in ('none', 'pending', 'uploaded', 'failed')),
  audio_error text,
  audio_uploaded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint song_audio_files_slot_index_check check (slot_index between 1 and 6),
  unique (song_id, slot_index)
);

alter table public.song_audio_files
add column if not exists song_id uuid references public.songs(id) on delete cascade,
add column if not exists slot_index integer,
add column if not exists label text,
add column if not exists audio_key text,
add column if not exists audio_url text,
add column if not exists audio_file_name text,
add column if not exists audio_content_type text,
add column if not exists audio_size_bytes bigint,
add column if not exists audio_status text not null default 'none',
add column if not exists audio_error text,
add column if not exists audio_uploaded_at timestamptz,
add column if not exists created_at timestamptz not null default timezone('utc', now()),
add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$
declare
  song_id_attnum smallint;
begin
  select attnum
  into song_id_attnum
  from pg_attribute
  where attrelid = 'public.song_audio_files'::regclass
    and attname = 'song_id'
    and not attisdropped;

  if song_id_attnum is null then
    raise exception 'Column public.song_audio_files.song_id not found';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where contype = 'f'
      and conrelid = 'public.song_audio_files'::regclass
      and confrelid = 'public.songs'::regclass
      and conkey = array[song_id_attnum]
  ) then
    alter table public.song_audio_files
    add constraint song_audio_files_song_id_fkey
    foreign key (song_id) references public.songs(id) on delete cascade;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'song_audio_files_slot_index_check'
      and conrelid = 'public.song_audio_files'::regclass
  ) then
    alter table public.song_audio_files
    add constraint song_audio_files_slot_index_check
    check (slot_index between 1 and 6);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'song_audio_files_audio_status_check'
      and conrelid = 'public.song_audio_files'::regclass
  ) then
    alter table public.song_audio_files
    add constraint song_audio_files_audio_status_check
    check (audio_status in ('none', 'pending', 'uploaded', 'failed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'song_audio_files_song_id_slot_index_key'
      and conrelid = 'public.song_audio_files'::regclass
  ) then
    alter table public.song_audio_files
    add constraint song_audio_files_song_id_slot_index_key
    unique (song_id, slot_index);
  end if;
end
$$;

create index if not exists songs_title_idx on public.songs(title);
create index if not exists songs_lyrics_idx on public.songs using gin (to_tsvector('simple', lyrics));
create index if not exists setlist_songs_setlist_idx on public.setlist_songs(setlist_id);
create index if not exists song_audio_files_song_idx on public.song_audio_files(song_id);

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

drop trigger if exists song_audio_files_updated_at on public.song_audio_files;
create trigger song_audio_files_updated_at
before update on public.song_audio_files
for each row
execute function public.handle_song_updated_at();

alter table public.songs enable row level security;
alter table public.setlists enable row level security;
alter table public.setlist_songs enable row level security;
alter table public.song_audio_files enable row level security;

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

drop policy if exists "public can manage song audio files" on public.song_audio_files;
drop policy if exists "authenticated users can manage song audio files" on public.song_audio_files;
create policy "public can manage song audio files"
on public.song_audio_files
for all
to anon, authenticated
using (true)
with check (true);
