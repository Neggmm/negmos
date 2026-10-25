import { createBrowserClient } from "@supabase/ssr";

// ============================================================
// NEGM OS — Browser Supabase client (singleton)
// ============================================================
//
// Used by client components for:
//   - Auth: signInWithPassword, signOut, onAuthStateChange
//   - Direct queries (subject to RLS policies)
//
// The anon key is safe to expose to the browser — RLS enforces
// that only the authenticated user can read/write their own data.
// Server-side mutations that require elevated privileges use the
// service_role key in src/lib/supabase/server.ts (file 3).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw at module load — that would break production builds
  // before env vars are set. Instead, log a warning and let the
  // auth flow fail at runtime with a helpful error.
  console.warn(
    "[NEGM OS] Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.",
  );
}

export const supabase = createBrowserClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
);
