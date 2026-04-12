"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { formatDisplayDate, formatRelativeStamp } from "@/lib/format";
import { listSetlists } from "@/lib/repository";
import type { SetlistSummary } from "@/lib/types";

export function SetlistsScreen() {
  const [setlists, setSetlists] = useState<SetlistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSetlists() {
      try {
        setLoading(true);
        setError("");
        const result = await listSetlists();
        setSetlists(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os repertorios.");
      } finally {
        setLoading(false);
      }
    }

    void loadSetlists();
  }, []);

  const totalSongsScheduled = setlists.reduce((sum, setlist) => sum + setlist.songsCount, 0);
  const nextSetlist = [...setlists]
    .filter((setlist) => new Date(setlist.eventDate).getTime() >= Date.now())
    .sort((left, right) => new Date(left.eventDate).getTime() - new Date(right.eventDate).getTime())[0];

  return (
    <AppShell
      title="Repertorios"
      description="Monte sequencias por ensaio, culto ou evento e consulte tudo pelo celular."
      highlights={[
        {
          label: "Repertorios",
          value: String(setlists.length),
          detail: loading ? "Buscando os eventos cadastrados." : "Cada evento com sua ordem pronta.",
        },
        {
          label: "Musicas na fila",
          value: String(totalSongsScheduled),
          detail: "Soma total das musicas distribuidas nos repertorios.",
        },
        {
          label: "Proximo evento",
          value: nextSetlist ? formatDisplayDate(nextSetlist.eventDate) : "Sem data",
          detail: nextSetlist ? nextSetlist.name : "Crie um repertorio para o proximo ensaio.",
        },
      ]}
      actions={
        <Link className="button" href="/setlists/new">
          Novo repertorio
        </Link>
      }
    >
      <section className="panel">
        <div className="toolbar">
          <span className="status">{loading ? "Carregando repertorios..." : `${setlists.length} repertorio(s)`}</span>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {!loading && setlists.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum repertorio criado</h3>
            <p>Crie uma sequencia inicial para o proximo ensaio ou apresentacao.</p>
          </div>
        ) : null}

        <div className="catalog-grid">
          {setlists.map((setlist) => (
            <article className="setlist-card" key={setlist.id}>
              <Link className="card-title-link" href={`/setlists/${setlist.id}`}>
                <h3>{setlist.name}</h3>
              </Link>
              <div className="meta-row">
                <span className="tag warm">{formatDisplayDate(setlist.eventDate)}</span>
                <span className="tag">{setlist.songsCount} musica(s)</span>
              </div>
              <p>{setlist.notes || "Sem observacoes por enquanto."}</p>
              <div className="card-footer">
                <span className="status">Criado em {formatRelativeStamp(setlist.createdAt)}</span>
                <Link className="button-ghost" href={`/setlists/${setlist.id}`}>
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
