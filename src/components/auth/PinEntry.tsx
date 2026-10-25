"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, ArrowRight, Loader2, Lock } from "lucide-react";
import { useOs } from "@/store/os-context";
import { verifyPin } from "@/lib/auth-actions";
import { cn, OS_NAME, sleep, WELCOME_NAME } from "@/lib/utils";

// ============================================================
// PinEntry — secure PIN entry interface
// ============================================================
//
// Security architecture (milestone 1):
//   1. The PIN is captured in a hidden <input type="password">.
//      The browser handles masking; we never store the plaintext
//      anywhere client-side beyond the input's controlled value.
//   2. On submit, the PIN is sent to the verifyPin server action
//      (file 14). The server is the ONLY place verification happens.
//      There is no client-side comparison, ever.
//   3. On success, we flip isAuthenticated in the OS context and
//      advance the phase to "desktop". The PIN value is cleared
//      from local state.
//   4. On error, we shake the dots, clear the PIN, and show the
//      server's error message.
//
// In milestone 2, only the server action body changes — this entire
// component stays exactly the same.

type PinState = "idle" | "verifying" | "error" | "success";

export function PinEntry() {
  const { setPhase, signIn } = useOs();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState("");
  const [state, setState] = useState<PinState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Auto-focus the hidden input on mount so the user can start typing
  // immediately — keyboard-first, Raycast-style.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (value: string) => {
      // Guard against double-submit and post-success clicks.
      if (state === "verifying" || state === "success") return;

      if (value.trim().length === 0) {
        setState("error");
        setError("PIN is required.");
        return;
      }

      setState("verifying");
      setError(null);

      try {
        const result = await verifyPin(value);
        if (result.success) {
          setState("success");
          // Brief celebration — let the dots turn emerald and the
          // "Access granted" message breathe before the crossfade.
          await sleep(500);
          signIn();
          setPhase("desktop");
        } else {
          setState("error");
          setError(result.error ?? "Verification failed.");
          setPin("");
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      } catch {
        // Network / unexpected error. Never leak the underlying error
        // to the UI — show a generic message instead.
        setState("error");
        setError("Network error. Try again.");
        setPin("");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [state, signIn, setPhase],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit(pin);
      } else if (e.key === "Escape" && state === "error") {
        setState("idle");
        setError(null);
        setPin("");
      }
    },
    [handleSubmit, pin, state],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (state === "verifying" || state === "success") return;
      // Cap length at 64 for sanity. Real length validation happens
      // server-side; this just prevents pathological inputs.
      const value = e.target.value.slice(0, 64);
      setPin(value);
      // Clear error state as soon as the user starts typing again.
      if (state === "error") {
        setState("idle");
        setError(null);
      }
    },
    [state],
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-surface-void"
    >
      {/* Ambient backdrop — softer than the boot screen, since the user
          needs to focus here rather than be impressed. */}
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

        {/* Identity + label */}
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
            Enter PIN · {WELCOME_NAME}
          </p>
        </motion.div>

        {/* PIN dots + hidden input */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full"
        >
          {/*
            Hidden input captures all keystrokes; auto-focused on mount.
            type="password" lets the browser mask; autoComplete="off"
            prevents credential managers from offering to save the PIN.
            opacity-0 hides the native dots — our custom DotRow below is
            the visible affordance.
          */}
          <input
            ref={inputRef}
            type="password"
            value={pin}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            aria-label="Enter your PIN"
            disabled={state === "verifying" || state === "success"}
            className="absolute inset-0 h-full w-full cursor-default opacity-0"
          />

          {/* Visible dot row — clickable to focus input */}
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            tabIndex={-1}
            className="flex w-full items-center justify-center rounded-lg py-6 transition-colors hover:bg-surface-hover/40"
          >
            <DotRow pin={pin} state={state} />
          </button>
        </motion.div>

        {/* Status / error / action line */}
        <div className="flex min-h-[2.5rem] w-full flex-col items-center justify-center gap-2">
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.button
                key="submit"
                type="button"
                onClick={() => handleSubmit(pin)}
                disabled={pin.length === 0}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-all",
                  pin.length === 0
                    ? "cursor-not-allowed border-transparent text-ink-tertiary"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-glow-sm",
                )}
              >
                Verify
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
                {error ?? "Verification failed"}
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

        {/* Hint line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center font-mono text-[10px] uppercase tracking-widest text-ink-quaternary"
        >
          Press Enter to verify · Esc to clear
        </motion.p>
      </div>
    </motion.div>
  );
}

// --- Dot row --------------------------------------------------------------

function DotRow({ pin, state }: { pin: string; state: PinState }) {
  // Show at least 4 dots, growing as the user types a longer PIN.
  // The minimum prevents the layout from jumping when the user clears
  // the field — there's always a stable baseline row visible.
  const minDots = 4;
  const count = Math.max(minDots, pin.length);

  return (
    <motion.div
      // Shake on error — classic OS-grade error feedback.
      animate={
        state === "error" ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }
      }
      transition={
        state === "error"
          ? { duration: 0.4, ease: "easeInOut" }
          : { duration: 0.2 }
      }
      className="flex items-center gap-2.5"
    >
      {Array.from({ length: count }).map((_, i) => {
        const filled = i < pin.length;
        const isSuccess = state === "success";
        const isVerifying = state === "verifying";

        return (
          <motion.span
            key={i}
            initial={false}
            animate={{
              scale: filled ? 1 : 0.85,
              opacity: filled || isSuccess ? 1 : 0.4,
            }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "block h-2.5 w-2.5 rounded-full transition-colors",
              isSuccess
                ? "bg-emerald-400 shadow-glow-sm"
                : isVerifying && filled
                  ? "bg-emerald-400/80"
                  : filled
                    ? "bg-emerald-500"
                    : "bg-surface-active",
            )}
          />
        );
      })}
    </motion.div>
  );
}
