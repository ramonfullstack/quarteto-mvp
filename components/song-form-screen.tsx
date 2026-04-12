"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createSong, getSong, updateSong } from "@/lib/repository";

type SongFormScreenProps = {
  songId?: string;
};

export function SongFormScreen({ songId }: SongFormScreenProps) {
  const router = useRouter();
  const isEditing = Boolean(songId);
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [musicalKey, setMusicalKey] = useState("");
  const [category, setCategory] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      description="Preencha letra, tom e marcadores simples para usar nos ensaios."
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
          <form className="field-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="title">Titulo</label>
              <input id="title" onChange={(event) => setTitle(event.target.value)} required value={title} />
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
              <input
                id="category"
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Ex.: adoracao, celebracao, comunhao"
                value={category}
              />
            </div>

            <div className="field">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                onChange={(event) => setTagsText(event.target.value)}
                placeholder="abertura, calma, final"
                value={tagsText}
              />
            </div>

            <div className="field">
              <label htmlFor="lyrics">Letra</label>
              <textarea
                id="lyrics"
                onChange={(event) => setLyrics(event.target.value)}
                placeholder="Cole a letra aqui"
                required
                value={lyrics}
              />
            </div>

            <div className="button-row">
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
