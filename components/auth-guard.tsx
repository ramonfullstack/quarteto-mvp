"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSession } from "@/hooks/use-app-session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading } = useAppSession();

  useEffect(() => {
    if (!loading && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, session]);

  if (loading || !session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="auth-kicker">Preparando o repertorio</span>
          <h1>Carregando</h1>
          <p>Conferindo sua sessao para abrir o painel do quarteto.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
