"use server";

/**
 * verifyPin — server-side PIN verification.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ⚠️  MILESTONE 1 STUB                                                  │
 * │                                                                        │
 * │ This server action is a placeholder for the first visual deployment.  │
 * │ It does NOT actually verify the PIN — it confirms the PIN is          │
 * │ well-formed and returns success. This is acceptable for milestone 1   │
 * │ because there is no Supabase backend yet.                             │
 * │                                                                        │
 * │ In milestone 2, the body of this function will be replaced with:      │
 * │   1. Look up the authenticated user's PIN hash in Supabase            │
 * │   2. Compare the provided PIN against the stored hash using          │
 * │      bcrypt.compare() or argon2                                        │
 * │   3. On failure, increment a rate-limit counter and return an error  │
 * │   4. On success, return { success: true } so the client can flip     │
 * │      the OS phase to "desktop"                                        │
 * │                                                                        │
 * │ The PIN value itself (e.g. "whoisnegm1565") is NEVER hardcoded in     │
 * │ client code, NEVER stored as plaintext in the database, and NEVER     │
 * │ logged to the server console.                                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * @param pin  The PIN string submitted from the PinEntry client component.
 * @returns    `{ success: boolean, error?: string }` — the client uses the
 *             `success` flag to decide whether to advance to the desktop
 *             phase, and uses `error` to display an inline error message.
 */
export async function verifyPin(
  pin: string,
): Promise<{ success: boolean; error?: string }> {
  // Basic input validation. This is NOT PIN verification — it's just
  // ensuring the client submitted a plausible value. Real verification
  // happens in milestone 2 against a server-side hash.
  if (!pin || pin.trim().length === 0) {
    return { success: false, error: "PIN is required." };
  }

  if (pin.length < 4) {
    return { success: false, error: "PIN must be at least 4 characters." };
  }

  // Simulate network/verification latency so the PIN entry UI shows its
  // "verifying" state. Milestone 2 will replace this with a real Supabase
  // query — a few hundred milliseconds in practice, similar to this delay.
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Milestone 1: always succeed for any non-empty, ≥4-char PIN.
  // Milestone 2 will replace this return with the result of
  // `bcrypt.compare(pin, storedHash)`.
  return { success: true };
}
