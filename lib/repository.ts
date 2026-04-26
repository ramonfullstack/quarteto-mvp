"use client";

import { appConfig } from "@/lib/config";
import {
  demoCreateSetlist,
  demoCreateSong,
  demoDeleteSetlist,
  demoDeleteSong,
  demoGetSetlist,
  demoGetSong,
  demoListSetlists,
  demoListSongs,
  demoUpsertSongAudioFile,
  demoUpdateSetlist,
  demoUpdateSong,
} from "@/lib/demo-store";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Setlist, SetlistInput, SetlistSummary, Song, SongAudioFile, SongAudioFileUpdate, SongInput } from "@/lib/types";

type SongRow = {
  id: string;
  title: string;
  lyrics: string;
  musical_key: string;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  song_audio_files?: SongAudioFileRow[] | null;
};

type SongAudioFileRow = {
  id: string;
  song_id: string;
  slot_index: number;
  label: string;
  audio_key: string | null;
  audio_url: string | null;
  audio_file_name: string | null;
  audio_content_type: string | null;
  audio_size_bytes: number | null;
  audio_status: SongAudioFile["audioStatus"];
  audio_error: string | null;
  audio_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
};

type SetlistRow = {
  id: string;
  name: string;
  event_date: string;
  notes: string | null;
  created_at: string;
};

type SetlistSongRow = {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  song?: SongRow | SongRow[] | null;
};

type PostgrestErrorLike = {
  code?: string;
  message?: string;
};

const baseSongSelectFields = "id, title, lyrics, musical_key, category, tags, created_at, updated_at";
const songAudioFileSelectFields =
  "id, song_id, slot_index, label, audio_key, audio_url, audio_file_name, audio_content_type, audio_size_bytes, audio_status, audio_error, audio_uploaded_at, created_at, updated_at";
const songSelectFields = `${baseSongSelectFields}, song_audio_files(${songAudioFileSelectFields})`;

function isMissingSongAudioRelationError(error: PostgrestErrorLike | null) {
  return error?.code === "PGRST200" && error.message?.includes("song_audio_files") === true;
}

async function loadSongAudioFilesBySongId(supabase: ReturnType<typeof getSupabaseBrowserClient>, songIds: string[]) {
  const audioFilesBySongId = new Map<string, SongAudioFileRow[]>();

  if (songIds.length === 0) {
    return audioFilesBySongId;
  }

  const { data, error } = await supabase
    .from("song_audio_files")
    .select(songAudioFileSelectFields)
    .in("song_id", songIds)
    .order("slot_index");

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const currentItems = audioFilesBySongId.get(row.song_id) ?? [];
    currentItems.push(row);
    audioFilesBySongId.set(row.song_id, currentItems);
  }

  return audioFilesBySongId;
}

async function mapSongsWithFallbackAudio(supabase: ReturnType<typeof getSupabaseBrowserClient>, rows: SongRow[]) {
  const audioFilesBySongId = await loadSongAudioFilesBySongId(
    supabase,
    rows.map((row) => row.id),
  );

  return rows.map((row) =>
    mapSong({
      ...row,
      song_audio_files: audioFilesBySongId.get(row.id) ?? [],
    }),
  );
}

function mapSongAudioFile(row: SongAudioFileRow): SongAudioFile {
  return {
    id: row.id,
    songId: row.song_id,
    slotIndex: row.slot_index,
    label: row.label,
    audioKey: row.audio_key,
    audioUrl: row.audio_url,
    audioFileName: row.audio_file_name,
    audioContentType: row.audio_content_type,
    audioSizeBytes: row.audio_size_bytes,
    audioStatus: row.audio_status,
    audioError: row.audio_error,
    audioUploadedAt: row.audio_uploaded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSong(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    lyrics: row.lyrics,
    musicalKey: row.musical_key,
    category: row.category ?? "",
    tags: row.tags ?? [],
    audioFiles: (row.song_audio_files ?? []).map(mapSongAudioFile).sort((left, right) => left.slotIndex - right.slotIndex),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSetlist(row: SetlistRow, songs: SetlistSongRow[]): Setlist {
  return {
    id: row.id,
    name: row.name,
    eventDate: row.event_date,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    songs: songs
      .sort((left, right) => left.position - right.position)
      .map((item) => ({
        id: item.id,
        setlistId: item.setlist_id,
        songId: item.song_id,
        position: item.position,
        song: item.song ? mapSong(Array.isArray(item.song) ? item.song[0] : item.song) : undefined,
      })),
  };
}

function sanitizeSearch(value: string) {
  return value.trim().replaceAll(",", " ");
}

function assertDataModeReady() {
  if (appConfig.isDemoMode) {
    return;
  }

  if (appConfig.hasMissingSupabaseConfig) {
    throw new Error(
      "Supabase nao configurado neste ambiente. Crie um .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

export async function listSongs(search = "") {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    return demoListSongs(search);
  }

  const supabase = getSupabaseBrowserClient();
  const safeSearch = sanitizeSearch(search);
  let query = supabase
    .from("songs")
    .select(songSelectFields)
    .order("title");

  if (safeSearch) {
    query = query.or(`title.ilike.%${safeSearch}%,lyrics.ilike.%${safeSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingSongAudioRelationError(error)) {
      let fallbackQuery = supabase
        .from("songs")
        .select(baseSongSelectFields)
        .order("title");

      if (safeSearch) {
        fallbackQuery = fallbackQuery.or(`title.ilike.%${safeSearch}%,lyrics.ilike.%${safeSearch}%`);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        throw fallbackError;
      }

      return mapSongsWithFallbackAudio(supabase, (fallbackData ?? []) as SongRow[]);
    }

    throw error;
  }

  return (data ?? []).map(mapSong);
}

export async function getSong(songId: string) {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    return demoGetSong(songId);
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("songs")
    .select(songSelectFields)
    .eq("id", songId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    if (isMissingSongAudioRelationError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("songs")
        .select(baseSongSelectFields)
        .eq("id", songId)
        .single();

      if (fallbackError) {
        if (fallbackError.code === "PGRST116") {
          return null;
        }

        throw fallbackError;
      }

      const songs = await mapSongsWithFallbackAudio(supabase, [fallbackData as SongRow]);
      return songs[0] ?? null;
    }

    throw error;
  }

  return mapSong(data);
}

export async function createSong(input: SongInput) {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    return demoCreateSong(input);
  }

  const supabase = getSupabaseBrowserClient();
  const payload = {
    title: input.title.trim(),
    lyrics: input.lyrics.trim(),
    musical_key: input.musicalKey.trim(),
    category: input.category.trim() || null,
    tags: input.tags,
  };

  const { data, error } = await supabase
    .from("songs")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return getSong(data.id);
}

export async function updateSong(songId: string, input: SongInput) {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    return demoUpdateSong(songId, input);
  }

  const supabase = getSupabaseBrowserClient();
  const payload = {
    title: input.title.trim(),
    lyrics: input.lyrics.trim(),
    musical_key: input.musicalKey.trim(),
    category: input.category.trim() || null,
    tags: input.tags,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("songs")
    .update(payload)
    .eq("id", songId)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return getSong(data.id);
}

export async function upsertSongAudioFile(songId: string, input: SongAudioFileUpdate) {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    return demoUpsertSongAudioFile(songId, input);
  }

  const supabase = getSupabaseBrowserClient();
  const payload = {
    song_id: songId,
    slot_index: input.slotIndex,
    label: input.label.trim(),
    audio_key: input.audioKey,
    audio_url: input.audioUrl,
    audio_file_name: input.audioFileName,
    audio_content_type: input.audioContentType,
    audio_size_bytes: input.audioSizeBytes,
    audio_status: input.audioStatus,
    audio_error: input.audioError,
    audio_uploaded_at: input.audioUploadedAt,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("song_audio_files").upsert(payload, {
    onConflict: "song_id,slot_index",
  });

  if (error) {
    throw error;
  }

  return getSong(songId);
}

export async function deleteSong(songId: string) {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    await demoDeleteSong(songId);
    return;
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("songs").delete().eq("id", songId);

  if (error) {
    throw error;
  }
}

export async function listSetlists(): Promise<SetlistSummary[]> {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    return demoListSetlists();
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("setlists")
    .select("id, name, event_date, notes, created_at, setlist_songs(id)")
    .order("event_date");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    eventDate: row.event_date,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    songsCount: Array.isArray(row.setlist_songs) ? row.setlist_songs.length : 0,
  }));
}

export async function getSetlist(setlistId: string) {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    return demoGetSetlist(setlistId);
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("setlists")
    .select(
      `id, name, event_date, notes, created_at, setlist_songs(id, setlist_id, song_id, position, song:songs(${baseSongSelectFields}))`,
    )
    .eq("id", setlistId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return mapSetlist(data, (data.setlist_songs ?? []) as SetlistSongRow[]);
}

export async function createSetlist(input: SetlistInput) {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    return demoCreateSetlist(input);
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("setlists")
    .insert({
      name: input.name.trim(),
      event_date: input.eventDate,
      notes: input.notes.trim() || null,
    })
    .select("id, name, event_date, notes, created_at")
    .single();

  if (error) {
    throw error;
  }

  if (input.songIds.length > 0) {
    const { error: relationError } = await supabase.from("setlist_songs").insert(
      input.songIds.map((songId, index) => ({
        setlist_id: data.id,
        song_id: songId,
        position: index + 1,
      })),
    );

    if (relationError) {
      throw relationError;
    }
  }

  return getSetlist(data.id);
}

export async function updateSetlist(setlistId: string, input: SetlistInput) {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    return demoUpdateSetlist(setlistId, input);
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("setlists")
    .update({
      name: input.name.trim(),
      event_date: input.eventDate,
      notes: input.notes.trim() || null,
    })
    .eq("id", setlistId);

  if (error) {
    throw error;
  }

  const { error: deleteError } = await supabase.from("setlist_songs").delete().eq("setlist_id", setlistId);

  if (deleteError) {
    throw deleteError;
  }

  if (input.songIds.length > 0) {
    const { error: relationError } = await supabase.from("setlist_songs").insert(
      input.songIds.map((songId, index) => ({
        setlist_id: setlistId,
        song_id: songId,
        position: index + 1,
      })),
    );

    if (relationError) {
      throw relationError;
    }
  }

  return getSetlist(setlistId);
}

export async function deleteSetlist(setlistId: string) {
  assertDataModeReady();
  if (appConfig.isDemoMode) {
    await demoDeleteSetlist(setlistId);
    return;
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("setlists").delete().eq("id", setlistId);

  if (error) {
    throw error;
  }
}
