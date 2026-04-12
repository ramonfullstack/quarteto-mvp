"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { formatRelativeStamp } from "@/lib/format";
import { listSongs } from "@/lib/repository";
import type { Song } from "@/lib/types";

export function SongsScreen() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSongs() {
      try {
        setLoading(true);
        setError("");
        const result = await listSongs(deferredSearch);
        setSongs(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar as musicas.");
      } finally {
        setLoading(false);
      }
    }

    void loadSongs();
  }, [deferredSearch]);

  const totalCategories = new Set(songs.map((song) => song.category).filter(Boolean)).size;
  const totalTags = new Set(songs.flatMap((song) => song.tags)).size;

  return (
    <AppShell
      title="Biblioteca de musicas"
      description="Busque por titulo ou letra, cadastre novas cancoes e mantenha o repertorio organizado."
      highlights={[
        {
          label: "Musicas",
          value: String(songs.length),
          detail: loading ? "Atualizando a biblioteca agora." : "Catalogo pronto para consulta rapida.",
        },
        {
          label: "Categorias",
          value: String(totalCategories),
          detail: "Ajuda a separar abertura, comunhao, celebracao e mais.",
        },
        {
          label: "Tags",
          value: String(totalTags),
          detail: "Marcadores simples para achar repertorio mais rapido.",
        },
      ]}
      actions={
        <Link className="button" href="/songs/new">
          Nova musica
        </Link>
      }
    >
      <section className="panel">
        <div className="toolbar">
          <input
            className="search-input"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por titulo, letra, categoria ou tag"
            type="search"
            value={search}
          />
          <span className="status">{loading ? "Atualizando lista..." : `${songs.length} musica(s)`}</span>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {!loading && songs.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma musica encontrada</h3>
            <p>Cadastre a primeira musica do quarteto ou ajuste o termo da busca.</p>
          </div>
        ) : null}

        <div className="catalog-grid">
          {songs.map((song) => (
            <article className="song-card" key={song.id}>
              <Link className="card-title-link" href={`/songs/${song.id}`}>
                <h3>{song.title}</h3>
              </Link>
              <div className="meta-row">
                {song.musicalKey ? <span className="tag warm">Tom {song.musicalKey}</span> : null}
                {song.category ? <span className="tag">{song.category}</span> : null}
                {song.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>
              <p>{song.lyrics.slice(0, 140)}{song.lyrics.length > 140 ? "..." : ""}</p>
              <div className="card-footer">
                <span className="status">Atualizada em {formatRelativeStamp(song.updatedAt)}</span>
                <Link className="button-ghost" href={`/songs/${song.id}`}>
                  Abrir
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
