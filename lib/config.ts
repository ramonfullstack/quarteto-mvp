const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const explicitDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const appConfig = {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  isSupabaseEnabled: isSupabaseConfigured && !explicitDemoMode,
  isDemoMode: explicitDemoMode,
  hasMissingSupabaseConfig: !explicitDemoMode && !isSupabaseConfigured,
};
