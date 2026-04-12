const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const explicitDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const appConfig = {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseEnabled: Boolean(supabaseUrl && supabaseAnonKey) && !explicitDemoMode,
  isDemoMode: explicitDemoMode || !supabaseUrl || !supabaseAnonKey,
};
