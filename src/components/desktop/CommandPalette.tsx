"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  CornerDownLeft,
  LayoutGrid,
  ListTodo,
  LogOut,
  PanelLeft,
  Search,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useOs } from "@/store/os-context";
import { cn } from "@/lib/utils";

// ============================================================
// CommandPalette — Raycast-style ⌘K command palette
// ============================================================
//
// Behavior:
//   ⌘K opens        (registered globally in os-context.tsx)
//   Esc closes      (registered globally in os-context.tsx)
//   ↑ / ↓ navigates
//   Enter executes the selected command
//   Backdrop click closes
//
// Search: case-insensitive substring match against each command's
// label and keyword list. Not a fuzzy-matching algorithm — for a
// dozen commands, substring is fast, simple, and predictable.
//
// Layout: palette sits 15vh from the top of the viewport (not
// centered) so the user's eye stays on the upper-third focal
// point. Spring entrance: scale 0.96 → 1 + y -8 → 0 + fade.

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  keywords?: string[];
  action: () => void;
}

export function CommandPalette() {
  const { setActiveView, setCommandPaletteOpen, toggleSidebar, signOut } =
    useOs();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Build the command list. Memoized so the array identity is stable
  // across re-renders unless a dependency changes. Each action closes
  // the palette after executing, so the user doesn't have to.
  const commands = useMemo<Command[]>(
    () => [
      {
        id: "nav-home",
        label: "Go to Home",
        hint: "Navigation",
        icon: LayoutGrid,
        keywords: ["home", "dashboard", "1"],
        action: () => {
          setActiveView("home");
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-finance",
        label: "Go to Finance",
        hint: "Navigation",
        icon: Wallet,
        keywords: ["finance", "money", "debts", "balance", "2"],
        action: () => {
          setActiveView("finance");
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-calendar",
        label: "Go to Calendar",
        hint: "Navigation",
        icon: Calendar,
        keywords: ["calendar", "events", "schedule", "3"],
        action: () => {
          setActiveView("calendar");
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-tasks",
        label: "Go to Tasks",
        hint: "Navigation",
        icon: ListTodo,
        keywords: ["tasks", "todo", "reminders", "4"],
        action: () => {
          setActiveView("tasks");
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        hint: "Navigation",
        icon: Settings,
        keywords: ["settings", "preferences", "config", "5"],
        action: () => {
          setActiveView("settings");
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "action-toggle-sidebar",
        label: "Toggle Sidebar",
        hint: "Action",
        icon: PanelLeft,
        keywords: ["sidebar", "collapse", "expand", "dock"],
        action: () => {
          toggleSidebar();
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "action-lock-os",
        label: "Lock OS",
        hint: "Session",
        icon: LogOut,
        keywords: ["lock", "sign out", "logout", "exit", "pin"],
        action: () => {
          setCommandPaletteOpen(false);
          signOut();
        },
      },
    ],
    [setActiveView, setCommandPaletteOpen, toggleSidebar, signOut],
  );

  // Filter commands by query — case-insensitive substring match
  // against label and keywords joined into a single haystack.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      const haystack = [cmd.label, ...(cmd.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  // Reset selection to the first item whenever the filtered list
  // changes length — prevents the selectedIndex from pointing past
  // the end of the list after the user types.
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Auto-focus the input on mount so the user can type immediately.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[selectedIndex];
      if (cmd) cmd.action();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
    >
      {/* Backdrop — click to close. Semi-transparent void + 4px blur
          so the desktop is still faintly visible behind the palette,
          reinforcing "this is a transient overlay, not a new page". */}
      <div
        aria-hidden
        onClick={() => setCommandPaletteOpen(false)}
        className="absolute inset-0 bg-surface-void/70 backdrop-blur-sm"
      />

      {/* Palette container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-line-default bg-surface-panel/90 shadow-elev-4 backdrop-blur-xl"
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 border-b border-line-subtle px-4 py-3">
          <Search
            className="h-4 w-4 shrink-0 text-ink-tertiary"
            strokeWidth={1.5}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands…"
            spellCheck={false}
            autoComplete="off"
            style={{ boxShadow: "none" }}
            className="flex-1 bg-transparent text-[14px] text-ink-primary placeholder:text-ink-quaternary focus:outline-none"
          />
          <kbd className="font-mono text-[10px] tabular text-ink-quaternary">
            Esc
          </kbd>
        </div>

        {/* Command list — scrollable if it exceeds 50vh */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-ink-tertiary">
              No commands match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <CommandRow
                key={cmd.id}
                command={cmd}
                active={i === selectedIndex}
                onClick={() => cmd.action()}
                onHover={() => setSelectedIndex(i)}
              />
            ))
          )}
        </div>

        {/* Footer — keyboard hints + brand stamp */}
        <div className="flex items-center justify-between border-t border-line-subtle px-4 py-2.5 text-[10px] text-ink-quaternary">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <CornerDownLeft className="h-3 w-3" strokeWidth={1.5} />
              Execute
            </span>
          </div>
          <span className="font-mono uppercase tracking-widest">
            NEGM OS · v0.1.0
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Command row -----------------------------------------------------------

interface CommandRowProps {
  command: Command;
  active: boolean;
  onClick: () => void;
  onHover: () => void;
}

function CommandRow({ command, active, onClick, onHover }: CommandRowProps) {
  const Icon = command.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        active
          ? "bg-emerald-500/10 text-emerald-300"
          : "text-ink-secondary hover:bg-surface-hover",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-emerald-300" : "text-ink-tertiary",
        )}
        strokeWidth={1.5}
      />
      <span className="flex-1 truncate text-[13px]">{command.label}</span>
      {command.hint && (
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-widest",
            active ? "text-emerald-300/60" : "text-ink-quaternary",
          )}
        >
          {command.hint}
        </span>
      )}
    </button>
  );
}
