"use client";

import { sampleSetlists, sampleSongs } from "@/lib/sample-data";
import type { AppSession, Setlist, SetlistInput, Song, SongAudioFile, SongAudioFileUpdate, SongInput } from "@/lib/types";
import { slugIncludes } from "@/lib/format";
import { getSongAudioSlotLabel } from "@/lib/song-audio";

const SONGS_KEY = "quarteto.demo.songs";
const SETLISTS_KEY = "quarteto.demo.setlists";
const SESSION_KEY = "quarteto.demo.session";

type LegacySong = Omit<Song, "audioFiles"> & {
  audioFiles?: SongAudioFile[];
  audioKey?: string | null;
  audioUrl?: string | null;
  audioFileName?: string | null;
  audioContentType?: string | null;
  audioSizeBytes?: number | null;
  audioStatus?: SongAudioFile["audioStatus"];
  audioError?: string | null;
  audioUploadedAt?: string | null;
};

function ensureSeeded() {
  if (typeof window === "undefined") {
    return;
  }

  if (!window.localStorage.getItem(SONGS_KEY)) {
    window.localStorage.setItem(SONGS_KEY, JSON.stringify(sampleSongs));
  }

  if (!window.localStorage.getItem(SETLISTS_KEY)) {
    window.localStorage.setItem(SETLISTS_KEY, JSON.stringify(sampleSetlists));
  }
}

function readStore<T>(key: string): T[] {
  ensureSeeded();
  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, payload: T[]) {
  window.localStorage.setItem(key, JSON.stringify(payload));
}

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function normalizeSongAudioFile(audioFile: SongAudioFile, songId: string): SongAudioFile {
  return {
    ...audioFile,
    songId,
    label: audioFile.label?.trim() || getSongAudioSlotLabel(audioFile.slotIndex),
    createdAt: audioFile.createdAt || new Date().toISOString(),
    updatedAt: audioFile.updatedAt || new Date().toISOString(),
  };
}

function buildLegacySongAudioFile(song: LegacySong): SongAudioFile[] {
  if (!song.audioKey && !song.audioFileName && song.audioStatus !== "failed" && song.audioStatus !== "pending") {
    return [];
  }

  return [
    {
      id: `legacy-audio-${song.id}-1`,
      songId: song.id,
      slotIndex: 1,
      label: "Audio principal",
      audioKey: song.audioKey ?? null,
      audioUrl: song.audioUrl ?? null,
      audioFileName: song.audioFileName ?? null,
      audioContentType: song.audioContentType ?? null,
      audioSizeBytes: song.audioSizeBytes ?? null,
      audioStatus: song.audioStatus ?? "none",
      audioError: song.audioError ?? null,
      audioUploadedAt: song.audioUploadedAt ?? null,
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
    },
  ];
}

function normalizeSong(song: LegacySong): Song {
  const audioFiles = Array.isArray(song.audioFiles) && song.audioFiles.length > 0 ? song.audioFiles : buildLegacySongAudioFile(song);

  return {
    id: song.id,
    title: song.title,
    lyrics: song.lyrics,
    musicalKey: song.musicalKey,
    category: song.category,
    tags: song.tags,
    audioFiles: audioFiles.map((audioFile) => normalizeSongAudioFile(audioFile, song.id)).sort((left, right) => left.slotIndex - right.slotIndex),
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
  };
}

function readSongsStore() {
  return readStore<LegacySong>(SONGS_KEY).map(normalizeSong);
}

export async function demoSignIn(email: string) {
  ensureSeeded();
  const session: AppSession = { email, source: "demo" };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function demoSignOut() {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function demoGetSession() {
  ensureSeeded();
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AppSession) : null;
}

export async function demoListSongs(search = "") {
  const songs = readSongsStore().sort((left, right) => left.title.localeCompare(right.title));
  const query = search.trim();

  if (!query) {
    return songs;
  }

  return songs.filter((song) =>
    [song.title, song.lyrics, song.category, song.tags.join(" ")].some((value) => slugIncludes(value, query)),
  );
}

export async function demoGetSong(songId: string) {
  return readSongsStore().find((song) => song.id === songId) ?? null;
}

export async function demoCreateSong(input: SongInput) {
  const songs = readSongsStore();
  const now = new Date().toISOString();

  const newSong: Song = {
    id: makeId("song"),
    title: input.title.trim(),
    lyrics: input.lyrics.trim(),
    musicalKey: input.musicalKey.trim(),
    category: input.category.trim(),
    tags: input.tags,
    audioFiles: [],
    createdAt: now,
    updatedAt: now,
  };

  songs.push(newSong);
  writeStore(SONGS_KEY, songs);
  return newSong;
}

export async function demoUpdateSong(songId: string, input: SongInput) {
  const songs = readSongsStore();
  const nextSongs = songs.map((song) =>
    song.id === songId
      ? {
          ...song,
          title: input.title.trim(),
          lyrics: input.lyrics.trim(),
          musicalKey: input.musicalKey.trim(),
          category: input.category.trim(),
          tags: input.tags,
          updatedAt: new Date().toISOString(),
        }
      : song,
  );

  writeStore(SONGS_KEY, nextSongs);
  return nextSongs.find((song) => song.id === songId) ?? null;
}

export async function demoUpsertSongAudioFile(songId: string, input: SongAudioFileUpdate) {
  const songs = readSongsStore();
  const now = new Date().toISOString();
  const nextSongs = songs.map((song) =>
    song.id === songId
      ? {
          ...song,
          audioFiles: [...song.audioFiles.filter((audioFile) => audioFile.slotIndex !== input.slotIndex), {
            id: song.audioFiles.find((audioFile) => audioFile.slotIndex === input.slotIndex)?.id ?? makeId("song-audio"),
            songId,
            slotIndex: input.slotIndex,
            label: input.label.trim() || getSongAudioSlotLabel(input.slotIndex),
            audioKey: input.audioKey ?? null,
            audioUrl: input.audioUrl ?? null,
            audioFileName: input.audioFileName ?? null,
            audioContentType: input.audioContentType ?? null,
            audioSizeBytes: input.audioSizeBytes ?? null,
            audioStatus: input.audioStatus,
            audioError: input.audioError ?? null,
            audioUploadedAt: input.audioUploadedAt ?? null,
            createdAt: song.audioFiles.find((audioFile) => audioFile.slotIndex === input.slotIndex)?.createdAt ?? now,
            updatedAt: now,
          }].sort((left, right) => left.slotIndex - right.slotIndex),
          updatedAt: now,
        }
      : song,
  );

  writeStore(SONGS_KEY, nextSongs);
  return nextSongs.find((song) => song.id === songId) ?? null;
}

export async function demoDeleteSong(songId: string) {
  const songs = readStore<Song>(SONGS_KEY).filter((song) => song.id !== songId);
  const setlists = readStore<Setlist>(SETLISTS_KEY).map((setlist) => ({
    ...setlist,
    songs: setlist.songs
      .filter((item) => item.songId !== songId)
      .map((item, index) => ({ ...item, position: index + 1 })),
  }));

  writeStore(SONGS_KEY, songs);
  writeStore(SETLISTS_KEY, setlists);
}

export async function demoListSetlists() {
  return readStore<Setlist>(SETLISTS_KEY)
    .map((setlist) => ({ ...setlist, songsCount: setlist.songs.length }))
    .sort((left, right) => left.eventDate.localeCompare(right.eventDate));
}

export async function demoGetSetlist(setlistId: string) {
  const songs = readStore<Song>(SONGS_KEY);
  const setlist = readStore<Setlist>(SETLISTS_KEY).find((item) => item.id === setlistId);

  if (!setlist) {
    return null;
  }

  return {
    ...setlist,
    songs: [...setlist.songs]
      .sort((left, right) => left.position - right.position)
      .map((item) => ({
        ...item,
        song: songs.find((song) => song.id === item.songId),
      })),
  };
}

export async function demoCreateSetlist(input: SetlistInput) {
  const songs = readStore<Song>(SONGS_KEY);
  const setlists = readStore<Setlist>(SETLISTS_KEY);
  const now = new Date().toISOString();
  const newSetlist: Setlist = {
    id: makeId("setlist"),
    name: input.name.trim(),
    eventDate: input.eventDate,
    notes: input.notes.trim(),
    createdAt: now,
    songs: [],
  };

  newSetlist.songs = input.songIds.map((songId, index) => ({
    id: makeId("setlist-song"),
    setlistId: newSetlist.id,
    songId,
    position: index + 1,
    song: songs.find((song) => song.id === songId),
  }));

  setlists.push(newSetlist);
  writeStore(SETLISTS_KEY, setlists);
  return newSetlist;
}

export async function demoUpdateSetlist(setlistId: string, input: SetlistInput) {
  const songs = readStore<Song>(SONGS_KEY);
  const setlists = readStore<Setlist>(SETLISTS_KEY);
  const nextSetlists = setlists.map((setlist) =>
    setlist.id === setlistId
      ? {
          ...setlist,
          name: input.name.trim(),
          eventDate: input.eventDate,
          notes: input.notes.trim(),
          songs: input.songIds.map((songId, index) => ({
            id: makeId("setlist-song"),
            setlistId,
            songId,
            position: index + 1,
            song: songs.find((song) => song.id === songId),
          })),
        }
      : setlist,
  );

  writeStore(SETLISTS_KEY, nextSetlists);
  return nextSetlists.find((item) => item.id === setlistId) ?? null;
}

export async function demoDeleteSetlist(setlistId: string) {
  const nextSetlists = readStore<Setlist>(SETLISTS_KEY).filter((setlist) => setlist.id !== setlistId);
  writeStore(SETLISTS_KEY, nextSetlists);
}
