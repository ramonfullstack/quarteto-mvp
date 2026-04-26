import type { SongAudioFile, SongAudioFileUpdate } from "@/lib/types";

const allowedAudioMimeTypes = new Set(["audio/mpeg"]);
const allowedAudioExtensions = [".mp3"];

export const maxSongAudioSizeBytes = 20 * 1024 * 1024;
export const maxSongAudioFiles = 6;

export const songAudioSlotPresets = [
  { slotIndex: 1, label: "Voz 1" },
  { slotIndex: 2, label: "Voz 2" },
  { slotIndex: 3, label: "Voz 3" },
  { slotIndex: 4, label: "Voz 4" },
  { slotIndex: 5, label: "Cantada" },
  { slotIndex: 6, label: "Playback" },
] as const;

type AudioFileLike = Pick<File, "name" | "size" | "type">;

type UploadedSongAudioResult = SongAudioFileUpdate & {
  audioKey: string;
  audioUrl: string;
  audioFileName: string;
  audioContentType: string;
  audioSizeBytes: number;
  audioUploadedAt: string;
  audioStatus: "uploaded";
  audioError: null;
};

export function isValidSongAudioSlotIndex(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= maxSongAudioFiles;
}

export function getSongAudioSlotLabel(slotIndex: number) {
  return songAudioSlotPresets.find((slot) => slot.slotIndex === slotIndex)?.label ?? `Audio ${slotIndex}`;
}

export function normalizeSongAudioLabel(slotIndex: number, label: string) {
  return label.trim() || getSongAudioSlotLabel(slotIndex);
}

export function buildSongAudioKey(songId: string, slotIndex: number) {
  return `songs/${songId}/audio-${slotIndex}.mp3`;
}

export function buildSongAudioUrl(songId: string, slotIndex: number) {
  return `/api/songs/${songId}/audio?slot=${slotIndex}`;
}

export function validateSongAudioFile(file: AudioFileLike) {
  const lowerName = file.name.toLocaleLowerCase("pt-BR");
  const hasAllowedExtension = allowedAudioExtensions.some((extension) => lowerName.endsWith(extension));
  const hasAllowedMimeType = allowedAudioMimeTypes.has(file.type);

  if (!hasAllowedExtension && !hasAllowedMimeType) {
    return "Envie um arquivo MP3 valido.";
  }

  if (file.size > maxSongAudioSizeBytes) {
    return "O MP3 deve ter no maximo 20 MB.";
  }

  return null;
}

export function buildPendingSongAudioUpdate(
  songId: string,
  slotIndex: number,
  label: string,
  file: AudioFileLike,
): SongAudioFileUpdate {
  return {
    slotIndex,
    label: normalizeSongAudioLabel(slotIndex, label),
    audioKey: buildSongAudioKey(songId, slotIndex),
    audioUrl: null,
    audioFileName: file.name,
    audioContentType: file.type || "audio/mpeg",
    audioSizeBytes: file.size,
    audioStatus: "pending",
    audioError: null,
    audioUploadedAt: null,
  };
}

export function buildFailedSongAudioUpdate(
  songId: string,
  slotIndex: number,
  label: string,
  file: AudioFileLike,
  errorMessage: string,
  previousAudio?: SongAudioFile | null,
): SongAudioFileUpdate {
  if (previousAudio?.audioStatus === "uploaded" && previousAudio.audioKey && previousAudio.audioUrl) {
    return {
      slotIndex,
      label: normalizeSongAudioLabel(slotIndex, label),
      audioKey: previousAudio.audioKey,
      audioUrl: previousAudio.audioUrl,
      audioFileName: previousAudio.audioFileName,
      audioContentType: previousAudio.audioContentType,
      audioSizeBytes: previousAudio.audioSizeBytes,
      audioStatus: "uploaded",
      audioError: errorMessage,
      audioUploadedAt: previousAudio.audioUploadedAt,
    };
  }

  return {
    slotIndex,
    label: normalizeSongAudioLabel(slotIndex, label),
    audioKey: buildSongAudioKey(songId, slotIndex),
    audioUrl: null,
    audioFileName: file.name,
    audioContentType: file.type || "audio/mpeg",
    audioSizeBytes: file.size,
    audioStatus: "failed",
    audioError: errorMessage,
    audioUploadedAt: null,
  };
}

export function buildSongAudioMetadataUpdate(audioFile: SongAudioFile, label: string): SongAudioFileUpdate {
  return {
    slotIndex: audioFile.slotIndex,
    label: normalizeSongAudioLabel(audioFile.slotIndex, label),
    audioKey: audioFile.audioKey,
    audioUrl: audioFile.audioUrl,
    audioFileName: audioFile.audioFileName,
    audioContentType: audioFile.audioContentType,
    audioSizeBytes: audioFile.audioSizeBytes,
    audioStatus: audioFile.audioStatus,
    audioError: audioFile.audioError,
    audioUploadedAt: audioFile.audioUploadedAt,
  };
}

export async function uploadSongAudioFile(
  songId: string,
  slotIndex: number,
  label: string,
  file: File,
): Promise<UploadedSongAudioResult> {
  const formData = new FormData();
  formData.append("slotIndex", String(slotIndex));
  formData.append("label", normalizeSongAudioLabel(slotIndex, label));
  formData.append("file", file);

  const response = await fetch(buildSongAudioUrl(songId, slotIndex), {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | (UploadedSongAudioResult & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "Falha ao enviar o audio.");
  }

  if (!payload) {
    throw new Error("Resposta invalida ao enviar o audio.");
  }

  return payload;
}