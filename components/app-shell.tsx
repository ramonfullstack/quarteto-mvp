"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appConfig } from "@/lib/config";

type AppShellProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  highlights?: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  children: React.ReactNode;
};

const navigation = [{ href: "/songs", label: "Musicas" }];

export function AppShell({ title, description, actions, highlights = [], children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="page-shell">
      <header className="panel topbar">
        <div className="brand brand-rich">
          <div className="brand-mark">Q</div>
          <div>
            <strong>Quarteto</strong>
            <span>Biblioteca simples para consultar letras e cadastrar musicas sem friccao.</span>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="mode-badge">
            {appConfig.isDemoMode
              ? "Modo teste local"
              : appConfig.hasMissingSupabaseConfig
                ? "Supabase nao configurado"
                : "Modo compartilhado Supabase"}
          </span>
          <Link className="button-ghost" href="/songs/new">
            Nova musica
          </Link>
        </div>
      </header>

      <div className="page-grid">
        <section className="hero-panel">
          <div className="hero-orb hero-orb-left" />
          <div className="hero-orb hero-orb-right" />
          <span className="kicker">Entrada direta, sem login, pronta para uso rapido no celular</span>
          <div className="page-title">
            <div>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {actions}
          </div>
          <nav className="nav-tabs">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  className={`nav-tab${isActive ? " is-active" : ""}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {highlights.length > 0 ? (
            <div className="hero-stats">
              {highlights.map((item) => (
                <article className="hero-stat-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          ) : null}

          {appConfig.hasMissingSupabaseConfig ? (
            <div className="config-warning">
              <strong>Falta configurar o Supabase neste ambiente.</strong>
              <p>
                Crie um arquivo <code>.env.local</code> com <code>NEXT_PUBLIC_DEMO_MODE=false</code>,
                <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          ) : null}
        </section>

        {children}
      </div>
    </div>
  );
}
