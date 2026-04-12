export type Song = {
  id: string;
  title: string;
  lyrics: string;
  musicalKey: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SongInput = {
  title: string;
  lyrics: string;
  musicalKey: string;
  category: string;
  tags: string[];
};

export type SetlistSong = {
  id: string;
  setlistId: string;
  songId: string;
  position: number;
  song?: Song;
};

export type Setlist = {
  id: string;
  name: string;
  eventDate: string;
  notes: string;
  createdAt: string;
  songs: SetlistSong[];
};

export type SetlistInput = {
  name: string;
  eventDate: string;
  notes: string;
  songIds: string[];
};

export type SetlistSummary = {
  id: string;
  name: string;
  eventDate: string;
  notes: string;
  createdAt: string;
  songsCount: number;
};

export type AppSession = {
  email: string;
  source: "demo" | "supabase";
};
