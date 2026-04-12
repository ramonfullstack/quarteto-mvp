"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSetlist, listSongs, createSetlist, updateSetlist } from "@/lib/repository";
import { slugIncludes } from "@/lib/format";
import type { Song } from "@/lib/types";

type SetlistFormScreenProps = {
  setlistId?: string;
};

export function SetlistFormScreen({ setlistId }: SetlistFormScreenProps) {
  const router = useRouter();
  const isEditing = Boolean(setlistId);
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [allSongs, currentSetlist] = await Promise.all([
          listSongs(),
          setlistId ? getSetlist(setlistId) : Promise.resolve(null),
        ]);

        setSongs(allSongs);
        if (currentSetlist) {
          setName(currentSetlist.name);
          setEventDate(currentSetlist.eventDate.slice(0, 10));
          setNotes(currentSetlist.notes);
          setSelectedSongIds(currentSetlist.songs.map((item) => item.songId));
        } else if (!setlistId) {
          setEventDate(new Date().toISOString().slice(0, 10));
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o repertorio.");
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, [setlistId]);

  const filteredSongs = songs.filter(
    (song) =>
      !selectedSongIds.includes(song.id) &&
      (!deferredSearch ||
        slugIncludes(`${song.title} ${song.lyrics} ${song.category} ${song.tags.join(" ")}`, deferredSearch)),
  );

  const selectedSongs = selectedSongIds
    .map((songId) => songs.find((song) => song.id === songId))
    .filter((song): song is Song => Boolean(song));

  function addSong(songId: string) {
    setSelectedSongIds((current) => [...current, songId]);
  }

  function removeSong(songId: string) {
    setSelectedSongIds((current) => current.filter((item) => item !== songId));
  }

  function moveSong(songId: string, direction: -1 | 1) {
    setSelectedSongIds((current) => {
      const index = current.indexOf(songId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      const payload = {
        name,
        eventDate: new Date(eventDate).toISOString(),
        notes,
        songIds: selectedSongIds,
      };

      const setlist = isEditing && setlistId ? await updateSetlist(setlistId, payload) : await createSetlist(payload);

      if (!setlist) {
        throw new Error("Nao foi possivel salvar o repertorio.");
      }

      startTransition(() => router.replace(`/setlists/${setlist.id}`));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title={isEditing ? "Editar repertorio" : "Novo repertorio"}
      description="Escolha a ordem das musicas e deixe a sequencia pronta para o evento."
      actions={
        <Link className="button-ghost" href={isEditing && setlistId ? `/setlists/${setlistId}` : "/setlists"}>
          Voltar
        </Link>
      }
    >
      <section className="panel">
        {loading ? <p className="status">Carregando formulario...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading ? (
          <form className="field-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Nome do repertorio</label>
              <input id="name" onChange={(event) => setName(event.target.value)} required value={name} />
            </div>

            <div className="field">
              <label htmlFor="eventDate">Data do evento</label>
              <input
                id="eventDate"
                onChange={(event) => setEventDate(event.target.value)}
                required
                type="date"
                value={eventDate}
              />
            </div>

            <div className="field">
              <label htmlFor="notes">Observacoes</label>
              <textarea
                id="notes"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ex.: entrada sem pausa, revisar divisao na 2a musica"
                value={notes}
              />
            </div>

            <div className="field">
              <label htmlFor="search">Buscar musicas para adicionar</label>
              <input
                id="search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite titulo, letra ou tag"
                value={search}
              />
            </div>

            <div className="selection-grid">
              <div className="field-grid">
                <h3>Disponiveis</h3>
                <div className="selection-list">
                  {filteredSongs.length === 0 ? (
                    <div className="empty-state">
                      <p>Nenhuma musica disponivel com esse filtro.</p>
                    </div>
                  ) : null}

                  {filteredSongs.map((song) => (
                    <div className="selection-item" key={song.id}>
                      <div>
                        <strong>{song.title}</strong>
                        <p>{song.musicalKey ? `Tom ${song.musicalKey}` : "Sem tom informado"}</p>
                      </div>
                      <button className="button-ghost" onClick={() => addSong(song.id)} type="button">
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field-grid">
                <h3>Selecionadas</h3>
                <div className="selected-list">
                  {selectedSongs.length === 0 ? (
                    <div className="empty-state">
                      <p>Adicione as musicas na ordem desejada.</p>
                    </div>
                  ) : null}

                  {selectedSongs.map((song, index) => (
                    <div className="selected-item" key={song.id}>
                      <div>
                        <strong>{index + 1}. {song.title}</strong>
                        <p>{song.category || "Sem categoria"}</p>
                      </div>
                      <div className="button-row">
                        <button
                          className="button-ghost"
                          onClick={() => moveSong(song.id, -1)}
                          type="button"
                        >
                          Subir
                        </button>
                        <button
                          className="button-ghost"
                          onClick={() => moveSong(song.id, 1)}
                          type="button"
                        >
                          Descer
                        </button>
                        <button
                          className="button-danger"
                          onClick={() => removeSong(song.id)}
                          type="button"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="button-row">
              <button className="button" disabled={saving} type="submit">
                {saving ? "Salvando..." : isEditing ? "Salvar repertorio" : "Criar repertorio"}
              </button>
              <Link className="button-ghost" href={isEditing && setlistId ? `/setlists/${setlistId}` : "/setlists"}>
                Cancelar
              </Link>
            </div>
          </form>
        ) : null}
      </section>
    </AppShell>
  );
}
