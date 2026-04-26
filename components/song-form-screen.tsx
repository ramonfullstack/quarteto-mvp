"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createSong, getSong, updateSong, upsertSongAudioFile } from "@/lib/repository";
import {
  buildSongAudioMetadataUpdate,
  buildFailedSongAudioUpdate,
  buildPendingSongAudioUpdate,
  getSongAudioSlotLabel,
  normalizeSongAudioLabel,
  songAudioSlotPresets,
  uploadSongAudioFile,
  validateSongAudioFile,
} from "@/lib/song-audio";
import { songCategories } from "@/lib/song-categories";
import type { Song, SongAudioFile } from "@/lib/types";

type SongFormScreenProps = {
  songId?: string;
};

type AudioSlotState = {
  slotIndex: number;
  label: string;
  file: File | null;
  existingAudio: SongAudioFile | null;
};

function buildAudioSlots(song?: Song | null): AudioSlotState[] {
  return songAudioSlotPresets.map((slot) => {
    const existingAudio = song?.audioFiles.find((audioFile) => audioFile.slotIndex === slot.slotIndex) ?? null;

    return {
      slotIndex: slot.slotIndex,
      label: existingAudio?.label ?? slot.label,
      file: null,
      existingAudio,
    };
  });
}

export function SongFormScreen({ songId }: SongFormScreenProps) {
  const router = useRouter();
  const isEditing = Boolean(songId);
  const [, setCurrentSong] = useState<Song | null>(null);
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [musicalKey, setMusicalKey] = useState("");
  const [category, setCategory] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [audioSlots, setAudioSlots] = useState<AudioSlotState[]>(() => buildAudioSlots());
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateAudioSlot(slotIndex: number, updater: (slot: AudioSlotState) => AudioSlotState) {
    setAudioSlots((currentSlots) =>
      currentSlots.map((slot) => (slot.slotIndex === slotIndex ? updater(slot) : slot)),
    );
  }

  async function persistAudioState(songToUpdateId: string, slotIndex: number, nextState: ReturnType<typeof buildPendingSongAudioUpdate>) {
    try {
      const updatedSong = await upsertSongAudioFile(songToUpdateId, nextState);

      if (!updatedSong) {
        return null;
      }

      setCurrentSong(updatedSong);
      setAudioSlots(buildAudioSlots(updatedSong));
      return updatedSong;
    } catch {
      updateAudioSlot(slotIndex, (slot) => slot);
      return null;
    }
  }

  useEffect(() => {
    if (!songId) {
      return;
    }

    async function loadSong() {
      try {
        setLoading(true);
        const currentSongId = songId!;
        const song = await getSong(currentSongId);

        if (!song) {
          setError("Musica nao encontrada.");
          return;
        }

        setCurrentSong(song);
        setAudioSlots(buildAudioSlots(song));
        setTitle(song.title);
        setLyrics(song.lyrics);
        setMusicalKey(song.musicalKey);
        setCategory(song.category);
        setTagsText(song.tags.join(", "));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar a musica.");
      } finally {
        setLoading(false);
      }
    }

    void loadSong();
  }, [songId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      const payload = {
        title,
        lyrics,
        musicalKey,
        category,
        tags: tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const song = isEditing && songId ? await updateSong(songId, payload) : await createSong(payload);

      if (!song) {
        throw new Error("Nao foi possivel salvar a musica.");
      }

      let latestSong = song;
      setCurrentSong(song);

      for (const slot of audioSlots) {
        const label = normalizeSongAudioLabel(slot.slotIndex, slot.label);
        const existingAudio = latestSong.audioFiles.find((audioFile) => audioFile.slotIndex === slot.slotIndex) ?? slot.existingAudio;

        if (!slot.file) {
          if (existingAudio && existingAudio.label !== label) {
            const updatedSong = await persistAudioState(
              song.id,
              slot.slotIndex,
              buildSongAudioMetadataUpdate(existingAudio, label),
            );

            if (updatedSong) {
              latestSong = updatedSong;
            }
          }

          continue;
        }

        const validationError = validateSongAudioFile(slot.file);

        if (validationError) {
          const updatedSong = await persistAudioState(
            song.id,
            slot.slotIndex,
            buildFailedSongAudioUpdate(song.id, slot.slotIndex, label, slot.file, validationError, existingAudio),
          );

          if (updatedSong) {
            latestSong = updatedSong;
          }

          continue;
        }

        const pendingSong = await persistAudioState(
          song.id,
          slot.slotIndex,
          buildPendingSongAudioUpdate(song.id, slot.slotIndex, label, slot.file),
        );

        if (pendingSong) {
          latestSong = pendingSong;
        }

        try {
          const uploadedAudio = await uploadSongAudioFile(song.id, slot.slotIndex, label, slot.file);
          const updatedSong = await persistAudioState(song.id, slot.slotIndex, uploadedAudio);

          if (updatedSong) {
            latestSong = updatedSong;
          }
        } catch (uploadError) {
          const uploadMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "Falha ao enviar o audio. A musica foi salva sem atualizar este MP3.";

          const updatedSong = await persistAudioState(
            song.id,
            slot.slotIndex,
            buildFailedSongAudioUpdate(song.id, slot.slotIndex, label, slot.file, uploadMessage, existingAudio),
          );

          if (updatedSong) {
            latestSong = updatedSong;
          }
        }
      }

      startTransition(() => router.replace(`/songs/${song.id}`));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title={isEditing ? "Editar musica" : "Nova musica"}
      description="Cadastre a letra com calma, escolha uma categoria pronta e deixe o acervo consistente."
      highlights={[
        {
          label: "Categorias prontas",
          value: String(songCategories.length),
          detail: "Quarteto, grupo, solo, coral e outras opcoes ja disponiveis.",
        },
        {
          label: "Foco",
          value: "Musica",
          detail: "Sem repertorios nem telas paralelas para distrair o cadastro.",
        },
      ]}
      actions={
        <Link className="button-ghost" href={isEditing && songId ? `/songs/${songId}` : "/songs"}>
          Voltar
        </Link>
      }
    >
      <section className="panel">
        {loading ? <p className="status">Carregando musica...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading ? (
          <form className="song-form-grid" onSubmit={handleSubmit}>
            <div className="field field-wide">
              <label htmlFor="title">Titulo da musica</label>
              <input
                id="title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Porque Ele Vive"
                required
                value={title}
              />
            </div>

            <div className="field">
              <label htmlFor="musicalKey">Tom</label>
              <input
                id="musicalKey"
                onChange={(event) => setMusicalKey(event.target.value)}
                placeholder="Ex.: G, Dm, Bb"
                value={musicalKey}
              />
            </div>

            <div className="field">
              <label htmlFor="category">Categoria</label>
              <select id="category" onChange={(event) => setCategory(event.target.value)} value={category}>
                <option value="">Selecione uma categoria</option>
                {songCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field field-wide">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                onChange={(event) => setTagsText(event.target.value)}
                placeholder="Louvor, pascoa, abertura, natal"
                value={tagsText}
              />
            </div>

            <div className="field field-wide">
              <label>Arquivos de audio</label>
              <p className="status">
                Cada musica pode ter ate 6 arquivos. O cadastro da musica continua mesmo se algum upload falhar.
              </p>
              <p className="status">Formato aceito: MP3. Tamanho maximo: 20 MB por arquivo.</p>
              <div className="audio-slot-grid">
                {audioSlots.map((slot) => (
                  <div className="audio-slot-card" key={slot.slotIndex}>
                    <div className="meta-row compact">
                      <span className="tag subtle">Slot {slot.slotIndex}</span>
                      <span className="tag warm">{getSongAudioSlotLabel(slot.slotIndex)}</span>
                    </div>
                    <div className="field">
                      <label htmlFor={`audio-label-${slot.slotIndex}`}>Rotulo</label>
                      <input
                        disabled={saving}
                        id={`audio-label-${slot.slotIndex}`}
                        onChange={(event) =>
                          updateAudioSlot(slot.slotIndex, (currentSlot) => ({
                            ...currentSlot,
                            label: event.target.value,
                          }))
                        }
                        placeholder={getSongAudioSlotLabel(slot.slotIndex)}
                        value={slot.label}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`audio-file-${slot.slotIndex}`}>Arquivo MP3</label>
                      <input
                        accept=".mp3,audio/mpeg"
                        disabled={saving}
                        id={`audio-file-${slot.slotIndex}`}
                        onChange={(event) =>
                          updateAudioSlot(slot.slotIndex, (currentSlot) => ({
                            ...currentSlot,
                            file: event.target.files?.[0] ?? null,
                          }))
                        }
                        type="file"
                      />
                    </div>
                    <p className="status">
                      {slot.file
                        ? `Selecionado: ${slot.file.name}`
                        : slot.existingAudio?.audioFileName
                          ? `Atual: ${slot.existingAudio.audioFileName}`
                          : "Nenhum arquivo neste slot."}
                    </p>
                    {slot.existingAudio?.audioError ? <p className="error-text">{slot.existingAudio.audioError}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="field field-wide">
              <label htmlFor="lyrics">Letra</label>
              <textarea
                id="lyrics"
                onChange={(event) => setLyrics(event.target.value)}
                placeholder="Cole a letra aqui"
                required
                value={lyrics}
              />
            </div>

            <div className="button-row field-wide">
              <button className="button" disabled={saving} type="submit">
                {saving ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Criar musica"}
              </button>
              <Link className="button-ghost" href={isEditing && songId ? `/songs/${songId}` : "/songs"}>
                Cancelar
              </Link>
            </div>
          </form>
        ) : null}
      </section>
    </AppShell>
  );
}
