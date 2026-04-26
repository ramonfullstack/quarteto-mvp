export type SongAudioStatus = "none" | "pending" | "uploaded" | "failed";

export type SongAudioFile = {
  id: string;
  songId: string;
  slotIndex: number;
  label: string;
  audioKey: string | null;
  audioUrl: string | null;
  audioFileName: string | null;
  audioContentType: string | null;
  audioSizeBytes: number | null;
  audioStatus: SongAudioStatus;
  audioError: string | null;
  audioUploadedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Song = {
  id: string;
  title: string;
  lyrics: string;
  musicalKey: string;
  category: string;
  tags: string[];
  audioFiles: SongAudioFile[];
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

export type SongAudioFileFields = Omit<SongAudioFile, "id" | "songId" | "createdAt" | "updatedAt">;

export type SongAudioFileUpdate = Partial<Omit<SongAudioFileFields, "audioStatus" | "slotIndex" | "label">> & {
  slotIndex: number;
  label: string;
  audioStatus: SongAudioStatus;
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
