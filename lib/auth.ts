"use client";

import { appConfig } from "@/lib/config";
import { demoGetSession, demoSignIn, demoSignOut } from "@/lib/demo-store";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AppSession } from "@/lib/types";

function toAppSession(email: string | undefined | null): AppSession | null {
  if (!email) {
    return null;
  }

  return {
    email,
    source: appConfig.isSupabaseEnabled ? "supabase" : "demo",
  };
}

export async function getCurrentSession() {
  if (appConfig.isDemoMode) {
    return demoGetSession();
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return toAppSession(data.session?.user.email);
}

export async function signIn(email: string, password: string, createAccount: boolean) {
  if (appConfig.isDemoMode) {
    return demoSignIn(email.trim());
  }

  const supabase = getSupabaseBrowserClient();
  const credentials = { email: email.trim(), password };
  const response = createAccount
    ? await supabase.auth.signUp(credentials)
    : await supabase.auth.signInWithPassword(credentials);

  if (response.error) {
    throw response.error;
  }

  const sessionEmail = response.data.user?.email ?? response.data.session?.user.email;

  if (!sessionEmail) {
    throw new Error("Conta criada. Se o Supabase exigir confirmacao por email, confirme e tente entrar novamente.");
  }

  return toAppSession(sessionEmail);
}

export async function signOut() {
  if (appConfig.isDemoMode) {
    await demoSignOut();
    return;
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
