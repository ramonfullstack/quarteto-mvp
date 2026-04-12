"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { deleteSetlist, getSetlist } from "@/lib/repository";
import { formatDisplayDate, formatRelativeStamp } from "@/lib/format";
import type { Setlist } from "@/lib/types";

type SetlistDetailScreenProps = {
  setlistId: string;
};

export function SetlistDetailScreen({ setlistId }: SetlistDetailScreenProps) {
  const router = useRouter();
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSetlist() {
      try {
        setLoading(true);
        const result = await getSetlist(setlistId);
        setSetlist(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o repertorio.");
      } finally {
        setLoading(false);
      }
    }

    void loadSetlist();
  }, [setlistId]);

  async function handleDelete() {
    const confirmed = window.confirm("Excluir este repertorio?");
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      await deleteSetlist(setlistId);
      startTransition(() => router.replace("/setlists"));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir o repertorio.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell
      title={setlist?.name ?? "Repertorio"}
      description="Veja a ordem das musicas e compartilhe a sequencia do evento com o grupo."
      actions={
        <div className="button-row">
          <Link className="button-ghost" href="/setlists">
            Voltar
          </Link>
          <Link className="button" href={`/setlists/${setlistId}/edit`}>
            Editar
          </Link>
        </div>
      }
    >
      <section className="panel">
        {loading ? <p className="status">Carregando repertorio...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && !setlist ? (
          <div className="empty-state">
            <h3>Repertorio nao encontrado</h3>
            <p>Ele pode ter sido removido ou o link esta incorreto.</p>
          </div>
        ) : null}

        {setlist ? (
          <div className="field-grid">
            <div className="empty-state">
              <div className="meta-row">
                <span className="tag warm">{formatDisplayDate(setlist.eventDate)}</span>
                <span className="tag">{setlist.songs.length} musica(s)</span>
              </div>
              <p>{setlist.notes || "Sem observacoes para este repertorio."}</p>
              <p>Criado em {formatRelativeStamp(setlist.createdAt)}</p>
            </div>

            <div className="list-grid">
              {setlist.songs.map((item) => (
                <article className="setlist-card" key={item.id}>
                  <div className="meta-row">
                    <span className="tag warm">{item.position}</span>
                    <span className="tag">{item.song?.musicalKey ? `Tom ${item.song.musicalKey}` : "Sem tom"}</span>
                  </div>
                  <h3>{item.song?.title ?? "Musica removida"}</h3>
                  <p>{item.song?.lyrics.slice(0, 120) ?? "Sem letra disponivel."}</p>
                  {item.song ? (
                    <Link className="button-ghost" href={`/songs/${item.song.id}`}>
                      Ver musica
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="button-row">
              <Link className="button" href={`/setlists/${setlistId}/edit`}>
                Editar repertorio
              </Link>
              <button className="button-danger" disabled={deleting} onClick={handleDelete} type="button">
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
