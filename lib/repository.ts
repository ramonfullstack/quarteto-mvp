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
  demoUpdateSetlist,
  demoUpdateSong,
} from "@/lib/demo-store";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Setlist, SetlistInput, SetlistSummary, Song, SongInput } from "@/lib/types";

type SongRow = {
  id: string;
  title: string;
  lyrics: string;
  musical_key: string;
  category: string | null;
  tags: string[] | null;
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

function mapSong(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    lyrics: row.lyrics,
    musicalKey: row.musical_key,
    category: row.category ?? "",
    tags: row.tags ?? [],
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
  let query = supabase
    .from("songs")
    .select("id, title, lyrics, musical_key, category, tags, created_at, updated_at")
    .order("title");

  const safeSearch = sanitizeSearch(search);
  if (safeSearch) {
    query = query.or(`title.ilike.%${safeSearch}%,lyrics.ilike.%${safeSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
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
    .select("id, title, lyrics, musical_key, category, tags, created_at, updated_at")
    .eq("id", songId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
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
    .select("id, title, lyrics, musical_key, category, tags, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return mapSong(data);
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
    .select("id, title, lyrics, musical_key, category, tags, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return mapSong(data);
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
      "id, name, event_date, notes, created_at, setlist_songs(id, setlist_id, song_id, position, song:songs(id, title, lyrics, musical_key, category, tags, created_at, updated_at))",
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
