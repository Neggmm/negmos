"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

// ============================================================
// NEGM OS — PIN verification (Supabase Auth)
// ============================================================
//
// Architecture:
//   - The PIN is the password for the Supabase Auth account
//     identified by NEXT_PUBLIC_NEGMOS_AUTH_EMAIL env var.
//   - This server action calls supabase.auth.signInWithPassword
//     with the configured email + the user-supplied PIN.
//   - Supabase verifies the PIN against the bcrypt-stored hash
//     server-side. NO client-side comparison happens.
//   - On success, @supabase/ssr sets auth cookies on the response.
//     The browser persists them.
//   - On the next request, the middleware reads the cookies and
//     refreshes the session if needed.
//
// Security properties:
//   1. The PIN is never logged server-side (only success/failure).
//   2. The email isn't a secret — only the PIN is.
//   3. The Supabase service handles rate limiting + brute force
//      protection (configurable per project in Supabase dashboard).
//   4. The auth cookies are HTTP-only + Secure + SameSite=Lax
//      (Supabase default — we don't override).
//
// Audit logging (milestone 2.5):
//   - Log every attempt (success + failure) with timestamp, IP,
//     user agent, and attempt count.
//   - Rate limit: 5 attempts per 5 minutes per IP.
//   - Lock out after 10 failures in 1 hour.

interface VerifyPinResult {
  success: boolean;
  error?: string;
}

export async function verifyPin(pin: string): Promise<VerifyPinResult> {
  // Basic input validation. This is NOT PIN verification — it's
  // just ensuring the client submitted a plausible value. Real
  // verification happens at Supabase.
  if (!pin || pin.trim().length === 0) {
    return { success: false, error: "PIN is required." };
  }

  if (pin.length < 4) {
    return { success: false, error: "PIN must be at least 4 characters." };
  }

  const email = process.env.NEXT_PUBLIC_NEGMOS_AUTH_EMAIL;
  if (!email) {
    console.error(
      "[NEGM OS] NEXT_PUBLIC_NEGMOS_AUTH_EMAIL env var is not set.",
    );
    return {
      success: false,
      error: "Authentication is not configured. Contact the administrator.",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    if (error) {
      // Map Supabase errors to user-friendly messages.
      // Never leak the underlying error message — it could reveal
      // the email format, the existence of the account, or stack traces.
      const isRateLimit = error.message
        .toLowerCase()
        .includes("rate limit");
      const isUnverified = error.message
        .toLowerCase()
        .includes("email not confirmed");

      // TODO milestone 2.5: audit log the failure
      // await logAuthAttempt({ success: false, reason: error.code });

      return {
        success: false,
        error: isRateLimit
          ? "Too many attempts. Try again later."
          : isUnverified
            ? "Account not verified. Check Supabase dashboard."
            : "Invalid PIN. Try again.",
      };
    }

    // TODO milestone 2.5: audit log the success
    // await logAuthAttempt({ success: true });

    return { success: true };
  } catch (err) {
    // Never leak the underlying error to the client.
    console.error("[NEGM OS] verifyPin error:", err);
    return { success: false, error: "Network error. Try again." };
  }
}
