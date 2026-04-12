"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { appConfig } from "@/lib/config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!appConfig.isSupabaseEnabled) {
    throw new Error("Supabase nao esta habilitado.");
  }

  if (!browserClient) {
    browserClient = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
  }

  return browserClient;
}
