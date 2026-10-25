import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// NEGM OS — Supabase auth session refresh middleware
// ============================================================
//
// Runs on every request (except static assets). Calls
// supabase.auth.getUser() which:
//   1. Reads the session JWT from the request cookies.
//   2. If expired, silently refreshes it via Supabase.
//   3. Writes the refreshed cookies back to the response.
//
// Without this middleware, the user's session would expire
// silently after the JWT lifetime (1 hour by default) and
// they'd be "logged out" on the next request even though they
// didn't sign out. This keeps them logged in transparently.

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip if env vars aren't configured — let the request proceed
  // without Supabase refresh. This prevents the middleware from
  // crashing during local dev setup or before Vercel env vars
  // are propagated.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Set on the request so downstream handlers see the new cookies
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Set on the response so the browser persists the new cookies
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // This call refreshes the session if needed. Even if we don't use
  // the returned user, the side effect of refreshing cookies is the
  // whole point of this middleware.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static   (Next.js static files)
     *   - _next/image    (image optimization files)
     *   - favicon.ico
     *   - static public assets (svg, png, jpg, jpeg, gif, webp, css, js, map)
     *
     * Running this middleware on static asset requests would be
     * wasted work — they don't have auth cookies that need refreshing.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map)$).*)",
  ],
};
