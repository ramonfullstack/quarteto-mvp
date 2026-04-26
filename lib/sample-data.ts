import type { Setlist, Song } from "@/lib/types";

const now = new Date().toISOString();

export const sampleSongs: Song[] = [
  {
    id: "song-1",
    title: "Santo, Santo",
    lyrics: "Santo, santo, santo\nDeus poderoso\nToda a terra canta o teu louvor",
    musicalKey: "G",
    category: "Adoracao",
    tags: ["abertura", "congregacional"],
    audioFiles: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "song-2",
    title: "Tu Es Fiel",
    lyrics: "Tu es fiel, Senhor\nMesmo quando eu nao vejo\nTeu cuidado me sustenta",
    musicalKey: "D",
    category: "Confianca",
    tags: ["calma", "ensaio"],
    audioFiles: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "song-3",
    title: "Aleluia ao Rei",
    lyrics: "Aleluia ao Rei\nSua graca nos alcancou\nCantaremos sem cessar",
    musicalKey: "A",
    category: "Celebracao",
    tags: ["final", "festa"],
    audioFiles: [],
    createdAt: now,
    updatedAt: now,
  },
];

export const sampleSetlists: Setlist[] = [
  {
    id: "setlist-1",
    name: "Ensaio de Quinta",
    eventDate: new Date().toISOString(),
    notes: "Sequencia base para revisar vozes.",
    createdAt: now,
    songs: [
      {
        id: "setlist-song-1",
        setlistId: "setlist-1",
        songId: "song-1",
        position: 1,
        song: sampleSongs[0],
      },
      {
        id: "setlist-song-2",
        setlistId: "setlist-1",
        songId: "song-2",
        position: 2,
        song: sampleSongs[1],
      },
    ],
  },
];
