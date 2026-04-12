"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { formatRelativeStamp } from "@/lib/format";
import { deleteSong, getSong } from "@/lib/repository";
import type { Song } from "@/lib/types";

type SongDetailScreenProps = {
  songId: string;
};

export function SongDetailScreen({ songId }: SongDetailScreenProps) {
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSong() {
      try {
        setLoading(true);
        const result = await getSong(songId);
        setSong(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar a musica.");
      } finally {
        setLoading(false);
      }
    }

    void loadSong();
  }, [songId]);

  async function handleDelete() {
    const confirmed = window.confirm("Remover esta musica do acervo?");
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      await deleteSong(songId);
      startTransition(() => router.replace("/songs"));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Nao foi possivel remover a musica.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell
      title={song?.title ?? "Musica"}
      description="Leitura limpa da letra com as informacoes principais visiveis sem poluicao."
      actions={
        <div className="button-row">
          <Link className="button-ghost" href="/songs">
            Voltar
          </Link>
          <Link className="button" href={`/songs/${songId}/edit`}>
            Editar
          </Link>
        </div>
      }
    >
      <section className="panel">
        {loading ? <p className="status">Carregando musica...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && !song ? (
          <div className="empty-state">
            <h3>Musica nao encontrada</h3>
            <p>Ela pode ter sido removida ou o link esta incorreto.</p>
          </div>
        ) : null}

        {song ? (
          <div className="song-detail-layout">
            <div className="song-detail-sidebar">
              <div className="detail-card">
                <h3>Resumo</h3>
                <div className="meta-row">
                  {song.musicalKey ? <span className="tag warm">Tom {song.musicalKey}</span> : null}
                  {song.category ? <span className="tag strong">{song.category}</span> : null}
                </div>
                <div className="meta-row compact">
                  {song.tags.map((tag) => (
                    <span className="tag subtle" key={tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
                <p>Atualizada em {formatRelativeStamp(song.updatedAt)}</p>
              </div>

              <div className="button-row">
                <Link className="button" href={`/songs/${songId}/edit`}>
                  Editar musica
                </Link>
                <button className="button-danger" disabled={deleting} onClick={handleDelete} type="button">
                  {deleting ? "Removendo..." : "Excluir"}
                </button>
              </div>
            </div>

            <div className="lyrics-card">
              <div className="lyrics-box">{song.lyrics}</div>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
