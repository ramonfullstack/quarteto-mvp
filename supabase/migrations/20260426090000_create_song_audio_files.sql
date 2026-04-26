create extension if not exists pgcrypto;

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
  audio_status text not null default 'none',
  audio_error text,
  audio_uploaded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint song_audio_files_slot_index_check check (slot_index between 1 and 6),
  constraint song_audio_files_audio_status_check check (audio_status in ('none', 'pending', 'uploaded', 'failed')),
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

create index if not exists song_audio_files_song_idx on public.song_audio_files(song_id);

drop trigger if exists song_audio_files_updated_at on public.song_audio_files;
create trigger song_audio_files_updated_at
before update on public.song_audio_files
for each row
execute function public.handle_song_updated_at();

insert into public.song_audio_files (
  song_id,
  slot_index,
  label,
  audio_key,
  audio_url,
  audio_file_name,
  audio_content_type,
  audio_size_bytes,
  audio_status,
  audio_error,
  audio_uploaded_at,
  created_at,
  updated_at
)
select
  id,
  1,
  'Audio principal',
  audio_key,
  audio_url,
  audio_file_name,
  audio_content_type,
  audio_size_bytes,
  audio_status,
  audio_error,
  audio_uploaded_at,
  created_at,
  updated_at
from public.songs
where audio_key is not null
on conflict (song_id, slot_index) do nothing;

alter table public.song_audio_files enable row level security;

drop policy if exists "public can manage song audio files" on public.song_audio_files;
drop policy if exists "authenticated users can manage song audio files" on public.song_audio_files;
create policy "public can manage song audio files"
on public.song_audio_files
for all
to anon, authenticated
using (true)
with check (true);