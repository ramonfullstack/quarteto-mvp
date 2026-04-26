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