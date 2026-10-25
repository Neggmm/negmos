"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useOs } from "@/store/os-context";
import { supabase } from "@/lib/supabase/client";
import { cn, OS_NAME, sleep } from "@/lib/utils";

// ============================================================
// LoginEntry — multi-account email + password sign-in
// ============================================================
//
// Architecture:
//   - Client-side supabase.auth.signInWithPassword({ email, password })
//   - Supabase verifies the password against the bcrypt hash server-side
//   - On success: @supabase/ssr sets auth cookies in the browser
//   - onAuthStateChange (SIGNED_IN) fires in OsProvider, which:
//       1. Reads the user info from the session
//       2. Updates the OsProvider's `user` state
//       3. Sets isAuthenticated=true and phase="desktop"
//
// To create a new account: Supabase Dashboard → Authentication →
// Users → Add user → Create new user (with email + password).
// Optionally set user_metadata: { display_name, initials, role }.

type LoginState = "idle" | "verifying" | "error" | "success";

export function PinEntry() {
  const { setPhase } = useOs();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Auto-focus email input on mount — keyboard-first
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (state === "verifying" || state === "success") return;

      if (!email.trim() || !password) {
        setState("error");
        setError("Email and password are required.");
        return;
      }

      setState("verifying");
      setError(null);

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setState("error");
          const isRateLimit = signInError.message
            .toLowerCase()
            .includes("rate limit");
          setError(
            isRateLimit
              ? "Too many attempts. Try again later."
              : "Invalid email or password.",
          );
          setPassword("");
          setTimeout(() => passwordRef.current?.focus(), 100);
          return;
        }

        // Success — onAuthStateChange (SIGNED_IN) fires in OsProvider,
        // which sets the user info and advances to desktop. We also
        // set a fallback here in case the listener is slow.
        setState("success");
        await sleep(500);
        setPhase("desktop");
      } catch {
        setState("error");
        setError("Network error. Try again.");
        setPassword("");
      }
    },
    [state, email, password, setPhase],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape" && state === "error") {
        setState("idle");
        setError(null);
        setPassword("");
      }
    },
    [handleSubmit, state],
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-surface-void"
    >
      {/* Ambient backdrop */}
      <div className="absolute inset-0 bg-aura opacity-60" />
      <div
        className="absolute inset-0 bg-grid opacity-30"
        style={{
          maskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 px-6">
        {/* Lock icon in an emerald ring */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/5 shadow-glow-sm"
        >
          <Lock className="h-4 w-4 text-emerald-300" strokeWidth={1.5} />
        </motion.div>

        {/* Identity */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-2"
        >
          <h1 className="wordmark text-lg font-light text-ink-primary sm:text-xl">
            {OS_NAME}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary">
            Sign in to your account
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full flex-col gap-4"
        >
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary"
            >
              Email
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-line-subtle bg-surface-panel/40 px-3 py-2.5 transition-colors focus-within:border-emerald-500/40 focus-within:bg-surface-panel/70">
              <Mail
                className="h-3.5 w-3.5 text-ink-tertiary"
                strokeWidth={1.5}
              />
              <input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                autoComplete="email"
                spellCheck={false}
                disabled={state === "verifying" || state === "success"}
                className="flex-1 bg-transparent text-[13px] text-ink-primary placeholder:text-ink-quaternary focus:outline-none"
                style={{ boxShadow: "none" }}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary"
            >
              Password
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-line-subtle bg-surface-panel/40 px-3 py-2.5 transition-colors focus-within:border-emerald-500/40 focus-within:bg-surface-panel/70">
              <Lock
                className="h-3.5 w-3.5 text-ink-tertiary"
                strokeWidth={1.5}
              />
              <input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (state === "error") {
                    setState("idle");
                    setError(null);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                autoComplete="current-password"
                spellCheck={false}
                disabled={state === "verifying" || state === "success"}
                className="flex-1 bg-transparent font-mono text-[13px] text-ink-primary placeholder:text-ink-quaternary focus:outline-none"
                style={{ boxShadow: "none" }}
              />
            </div>
          </div>

          {/* Status / error / action line */}
          <div className="flex min-h-[2.5rem] items-center justify-center">
            <AnimatePresence mode="wait">
              {state === "idle" && (
                <motion.button
                  key="submit"
                  type="submit"
                  disabled={!email.trim() || !password}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-all",
                    !email.trim() || !password
                      ? "cursor-not-allowed border-transparent text-ink-tertiary"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-glow-sm",
                  )}
                >
                  Sign in
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              )}

              {state === "verifying" && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-emerald-300/80"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Verifying
                </motion.div>
              )}

              {state === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-status-danger"
                >
                  <AlertCircle className="h-3 w-3" />
                  {error ?? "Sign in failed"}
                </motion.div>
              )}

              {state === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-emerald-300"
                >
                  Access granted
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.form>

        {/* Hint line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center font-mono text-[10px] uppercase tracking-widest text-ink-quaternary"
        >
          Press Enter to sign in · Esc to clear
        </motion.p>
      </div>
    </motion.div>
  );
}
