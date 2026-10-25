"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { useOs } from "@/store/os-context";
import { OS_NAME, WELCOME_MESSAGE } from "@/lib/utils";

/**
 * BootScreen — the cinematic OS cold-start sequence.
 *
 * Timeline (seconds from mount):
 *   0.0  BootScreen container fades in (0.6s)
 *   0.2  Emerald aura blooms in from above (1.4s)
 *   0.3  Scan line streaks down the viewport (1.4s)
 *   0.4  32px luminous grid fades in, masked to center (1.6s)
 *   0.6  Viewfinder corner brackets appear, staggered (0.6s each)
 *   0.8  "NEGM OS" wordmark reveals with collapsing letter-spacing (1.2s)
 *   1.4  Hairline divider scales in (0.8s)
 *   1.6  Subtitle "System initializing · v0.1.0" fades in (0.8s)
 *   2.2  "WELCOME, DR. NEGM" appears with emerald glow (1.0s)
 *   3.6  Auto-advance to the PIN phase
 *
 * For prefers-reduced-motion users, the auto-advance is shortened to
 * 200ms — they see the final composed frame briefly, then move on.
 *
 * The component is itself a motion.div with an exit animation, so
 * AnimatePresence mode="wait" in page.tsx can crossfade us out to
 * the PIN screen with a fade + slight zoom + blur.
 */
export function BootScreen() {
  const { setPhase } = useOs();

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const delay = prefersReduced ? 200 : 3600;
    const t = setTimeout(() => setPhase("pin"), delay);
    return () => clearTimeout(t);
  }, [setPhase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-surface-void"
    >
      {/* Ambient emerald aura — soft top-down glow */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.2 }}
        className="absolute inset-0 bg-aura"
      />

      {/* Subtle 32px grid — visible only at the center, fades to edges */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.6, delay: 0.4 }}
        className="absolute inset-0 bg-grid"
        style={{
          maskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 65%)",
        }}
      />

      {/* Scan line — a thin emerald streak that sweeps down once */}
      <motion.div
        aria-hidden
        initial={{ y: "-100%", opacity: 0 }}
        animate={{ y: "100vh", opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
        className="absolute left-0 right-0 h-px bg-scan-gradient shadow-glow-sm"
      />

      {/* Center stack — wordmark + subtitle + welcome line */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Wordmark — "NEGM OS" with cinematic letter-spacing collapse */}
        <motion.h1
          initial={{ opacity: 0, y: 8, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.32em" }}
          transition={{
            duration: 1.2,
            delay: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="wordmark text-2xl font-light text-ink-primary sm:text-4xl"
        >
          {OS_NAME}
        </motion.h1>

        {/* Hairline divider — gradient stroke that scales in from center */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="h-px w-24 origin-center bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
        />

        {/* Subtitle — system status line in JetBrains Mono */}
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-[11px] uppercase tracking-widest text-ink-tertiary"
        >
          System initializing · v0.1.0
        </motion.p>

        {/* Welcome line — appears last with emerald glow */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            delay: 2.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="wordmark mt-8 text-sm font-light text-emerald-300 sm:text-base"
          style={{ textShadow: "0 0 24px rgba(16,185,129,0.45)" }}
        >
          {WELCOME_MESSAGE}
        </motion.h2>
      </div>

      {/* Corner brackets — viewfinder chrome, staggered appearance */}
      <CornerBracket className="left-6 top-6" rotate={0} delay={0.6} />
      <CornerBracket className="right-6 top-6" rotate={90} delay={0.7} />
      <CornerBracket className="bottom-6 right-6" rotate={180} delay={0.8} />
      <CornerBracket className="bottom-6 left-6" rotate={270} delay={0.9} />
    </motion.div>
  );
}

// --- Corner brackets -------------------------------------------------------
// A small detail that screams "operating system" rather than "web page".
// Four L-shaped marks in the viewport corners, like a camera viewfinder.
// The outer motion.div handles opacity + scale animation; the inner div
// handles rotation — kept separate so Motion's transform doesn't
// overwrite the rotation we want to persist.

function CornerBracket({
  className = "",
  rotate = 0,
  delay = 0.6,
}: {
  className?: string;
  rotate?: number;
  delay?: number;
}) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 0.4, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute ${className}`}
    >
      <div
        className="h-3 w-3 border-l border-t border-emerald-500/40"
        style={{ transform: `rotate(${rotate}deg)` }}
      />
    </motion.div>
  );
}
