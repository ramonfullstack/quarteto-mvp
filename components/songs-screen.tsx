"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { formatRelativeStamp } from "@/lib/format";
import { listSongs } from "@/lib/repository";
import { categoryFilterOptions } from "@/lib/song-categories";
import type { Song } from "@/lib/types";

export function SongsScreen() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof categoryFilterOptions)[number]>("Todas");
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

  const filteredSongs =
    categoryFilter === "Todas" ? songs : songs.filter((song) => song.category === categoryFilter);

  const totalCategories = new Set(songs.map((song) => song.category).filter(Boolean)).size;
  const totalKeys = new Set(songs.map((song) => song.musicalKey).filter(Boolean)).size;

  return (
    <AppShell
      title="Musicas do grupo"
      description="Um painel limpo para localizar letras, classificar por tipo de apresentacao e manter tudo facil de achar."
      highlights={[
        {
          label: "Musicas",
          value: String(filteredSongs.length),
          detail: loading ? "Atualizando a biblioteca agora." : "Lista pronta para uso rapido em ensaio e culto.",
        },
        {
          label: "Categorias",
          value: String(totalCategories),
          detail: "Padroes como quarteto, grupo, solo e coral para achar mais rapido.",
        },
        {
          label: "Tons",
          value: String(totalKeys),
          detail: "Visualizacao compacta para bater o olho no tom da musica.",
        },
      ]}
      actions={
        <Link className="button" href="/songs/new">
          Nova musica
        </Link>
      }
    >
      <section className="panel">
        <div className="library-toolbar">
          <div className="toolbar-search-block">
            <input
              className="search-input"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por titulo, letra ou tag"
              type="search"
              value={search}
            />
          </div>
          <div aria-label="Filtrar por categoria" className="category-pills" role="tablist">
            {categoryFilterOptions.map((option) => (
              <button
                key={option}
                className={`category-pill${categoryFilter === option ? " is-active" : ""}`}
                onClick={() => setCategoryFilter(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
          <span className="status">
            {loading ? "Atualizando lista..." : `${filteredSongs.length} musica(s) visiveis`}
          </span>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {!loading && filteredSongs.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma musica encontrada</h3>
            <p>Ajuste a busca, troque a categoria ou cadastre a primeira musica do acervo.</p>
          </div>
        ) : null}

        <div className="song-list">
          {filteredSongs.map((song) => (
            <article className="song-card" key={song.id}>
              <Link className="song-card-main" href={`/songs/${song.id}`}>
                <div className="song-card-heading">
                  <div>
                    <h3>{song.title}</h3>
                    <p className="song-preview">
                      {song.lyrics.slice(0, 140)}
                      {song.lyrics.length > 140 ? "..." : ""}
                    </p>
                  </div>
                  {song.musicalKey ? <span className="key-badge">{song.musicalKey}</span> : null}
                </div>
                <div className="meta-row compact">
                  {song.category ? <span className="tag strong">{song.category}</span> : null}
                  {song.tags.slice(0, 3).map((tag) => (
                    <span className="tag subtle" key={tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="card-footer">
                  <span className="status">Atualizada em {formatRelativeStamp(song.updatedAt)}</span>
                  <span className="open-inline">Abrir</span>
                </div>
              </Link>
              <div className="song-card-actions">
                <Link className="button-ghost" href={`/songs/${song.id}/edit`}>
                  Editar
                </Link>
                <Link className="button" href={`/songs/${song.id}`}>
                  Ver letra
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
