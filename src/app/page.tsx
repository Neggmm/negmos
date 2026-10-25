"use client";

import { AnimatePresence } from "motion/react";
import { OsProvider, useOs } from "@/store/os-context";
import { BootScreen } from "@/components/boot/BootScreen";
import { PinEntry } from "@/components/auth/PinEntry";
import { DesktopShell } from "@/components/desktop/DesktopShell";

/**
 * OsPhases — the cinematic state machine.
 *
 * Reads the current `phase` from the OS context and renders the matching
 * screen inside an AnimatePresence with `mode="wait"`. That mode tells
 * Motion to fully exit the current phase before mounting the next one —
 * no overlap, no janky crossfade. Each phase component is itself a
 * motion.div with its own initial/animate/exit, so the transitions are
 * authored at the component level, not here.
 *
 * Phase flow:
 *   boot   → cinematic reveal + "WELCOME, DR. NEGM" → auto-advance to pin
 *   pin    → secure PIN entry → on success → advance to desktop
 *   desktop→ persistent OS shell (sidebar, top bar, views, command palette)
 */
function OsPhases() {
  const { phase } = useOs();

  return (
    <AnimatePresence mode="wait">
      {phase === "boot" && <BootScreen key="boot" />}
      {phase === "pin" && <PinEntry key="pin" />}
      {phase === "desktop" && <DesktopShell key="desktop" />}
    </AnimatePresence>
  );
}

export default function Page() {
  return (
    <OsProvider>
      <OsPhases />
    </OsProvider>
  );
}
