do $$
begin
  if to_regclass('public.songs') is null then
    raise notice 'Tabela public.songs nao existe ainda. Pulando reconciliacao de colunas de audio.';
    return;
  end if;

  alter table public.songs
  add column if not exists audio_key text,
  add column if not exists audio_url text,
  add column if not exists audio_file_name text,
  add column if not exists audio_content_type text,
  add column if not exists audio_size_bytes bigint,
  add column if not exists audio_status text not null default 'none',
  add column if not exists audio_error text,
  add column if not exists audio_uploaded_at timestamptz;

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