"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appConfig } from "@/lib/config";
import { getCurrentSession, signIn } from "@/lib/auth";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nextPath = searchParams.get("next") || "/songs";

  useEffect(() => {
    async function validateSession() {
      const session = await getCurrentSession();
      if (session) {
        router.replace(nextPath);
      }
    }

    void validateSession();
  }, [nextPath, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");
      await signIn(email, password, createAccount);
      startTransition(() => router.replace(nextPath));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel entrar agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="auth-kicker">
          {appConfig.isDemoMode ? "Teste imediato sem backend" : "Pronto para Supabase + Vercel"}
        </span>
        <h1>Quarteto</h1>
        <p>
          Entre para cadastrar musicas, montar repertorios e consultar letras no ensaio.
          {appConfig.isDemoMode
            ? " No modo demo, qualquer email funciona e os dados ficam no navegador."
            : " No modo Supabase, use email e senha cadastrados no projeto."}
        </p>

        <form className="field-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="quarteto@exemplo.com"
              required
              type="email"
              value={email}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              autoComplete={createAccount ? "new-password" : "current-password"}
              id="password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo de 6 caracteres"
              required={!appConfig.isDemoMode}
              type="password"
              value={password}
            />
          </div>

          <div className="button-row">
            <button className="button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Entrando..." : createAccount ? "Criar conta" : "Entrar"}
            </button>
            {!appConfig.isDemoMode ? (
              <button
                className="button-ghost"
                onClick={() => setCreateAccount((current) => !current)}
                type="button"
              >
                {createAccount ? "Ja tenho conta" : "Criar conta"}
              </button>
            ) : null}
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
