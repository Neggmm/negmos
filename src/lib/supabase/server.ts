import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// ============================================================
// NEGM OS — Server-side Supabase clients
// ============================================================
//
// Two clients:
//   - createServerSupabaseClient() — for RSC + Server Actions.
//     Uses anon key + cookies. Subject to RLS. Use for ALL
//     user-scoped operations on behalf of the authenticated user.
//
//   - createServiceRoleClient() — for admin operations that
//     genuinely require bypassing RLS (e.g., creating users during
//     first-run setup, running migrations, audit queries). NEVER
//     expose this to the client bundle. Use sparingly.

// Type for @supabase/ssr's cookiesToSet parameter.
// Defined manually because @supabase/ssr doesn't export the type
// publicly, and TypeScript's noImplicitAny requires an annotation.
// The `options` field matches next/headers' ResponseCookie shape.
interface CookieToSet {
  name: string;
  value: string;
  options?: {
    domain?: string;
    expires?: Date | number;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
  };
}

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[NEGM OS] Missing env var: ${name}. Check Vercel → Settings → Environment Variables.`,
    );
  }
  return value;
}

/**
 * createServerSupabaseClient — async (cookies() is a Promise in
 * Next.js 15). Returns a Supabase client configured with the
 * current user's session cookies. Use in:
 *   - Server Components (RSC) for reading user-scoped data.
 *   - Server Actions for mutating user-scoped data.
 *
 * The setAll cookie handler catches errors silently because Server
 * Components are read-only. The middleware (src/middleware.ts)
 * handles session refresh on every request instead.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignored — Server Components are read-only; middleware handles refresh
          }
        },
      },
    },
  );
}

/**
 * createServiceRoleClient — admin client that bypasses RLS.
 * NEVER expose this to the client. Use only in:
 *   - Server-side admin operations (user creation, schema migrations)
 *   - Audit queries that need to read across all rows
 *   - Maintenance scripts
 */
export function createServiceRoleClient() {
  return createClient(
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
