"use client";

import { useEffect, useState } from "react";
import { appConfig } from "@/lib/config";
import { getCurrentSession } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AppSession } from "@/lib/types";

export function useAppSession() {
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function refresh() {
      try {
        setLoading(true);
        const currentSession = await getCurrentSession();
        setSession(currentSession);
      } finally {
        setLoading(false);
      }
    }

    void refresh();

    if (!appConfig.isSupabaseEnabled) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(
        currentSession?.user.email
          ? { email: currentSession.user.email, source: "supabase" }
          : null,
      );
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
