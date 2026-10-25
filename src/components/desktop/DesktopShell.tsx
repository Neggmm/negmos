"use client";

import { motion, AnimatePresence } from "motion/react";
import { useOs } from "@/store/os-context";
import { Sidebar } from "@/components/desktop/Sidebar";
import { TopBar } from "@/components/desktop/TopBar";
import { CommandPalette } from "@/components/desktop/CommandPalette";
import { HomeView } from "@/components/desktop/views/HomeView";
import { FinanceView } from "@/components/desktop/views/FinanceView";
import { CalendarView } from "@/components/desktop/views/CalendarView";
import { TasksView } from "@/components/desktop/views/TasksView";
import { SettingsView } from "@/components/desktop/views/SettingsView";
import type { ViewId } from "@/store/os-context";

// ============================================================
// DesktopShell — the OS shell container
// ============================================================
//
// Layout (desktop):
//
//   ┌──────────┬──────────────────────────────────────────┐
//   │          │  TopBar                                  │
//   │ Sidebar  ├──────────────────────────────────────────┤
//   │          │                                          │
//   │  Home    │                                          │
//   │  Finance │            Active View                  │
//   │  ...     │            (scrollable)                  │
//   │          │                                          │
//   └──────────┴──────────────────────────────────────────┘
//
//   [CommandPalette — overlays everything when ⌘K is pressed]
//
// The sidebar's width animates between expanded (224px) and
// collapsed (64px) based on sidebarCollapsed in OS context.
// The main column flexes to fill the rest.
//
// View transitions use AnimatePresence mode="wait" — the old view
// fully exits (fade + slide up) before the new view mounts and
// animates in (fade + slide up from y:8). Total ~600ms, cinematic.

const VIEWS: Record<ViewId, React.ComponentType> = {
  home: HomeView,
  finance: FinanceView,
  calendar: CalendarView,
  tasks: TasksView,
  settings: SettingsView,
};

export function DesktopShell() {
  const { activeView, commandPaletteOpen } = useOs();
  const ActiveView = VIEWS[activeView];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.01, filter: "blur(8px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 flex overflow-hidden bg-surface-void"
    >
      {/* Subtle ambient aura — pointer-events-none so it never blocks
          clicks. Lower opacity than the boot/pin screens because the
          desktop is for working, not for being impressed. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-aura opacity-30"
      />

      {/* Sidebar — width animates between 224px and 64px */}
      <Sidebar />

      {/* Main column — top bar + scrolling view content */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar />

        {/* View container with crossfade transitions */}
        <main className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 overflow-y-auto"
            >
              <ActiveView />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command palette — overlays everything when open */}
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette key="palette" />}
      </AnimatePresence>
    </motion.div>
  );
}
