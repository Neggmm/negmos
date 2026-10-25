"use client";

import { useEffect, useState } from "react";
import { Command, Search } from "lucide-react";
import { useOs, type ViewId } from "@/store/os-context";
import { formatDate, formatTime } from "@/lib/utils";

// ============================================================
// TopBar — the OS status bar
// ============================================================
//
// Layout (left → right):
//
//   [View Title] · [NEGM OS]    [⌘K Search...]    [14:32 · Sat, Oct 25]  [DN]
//
//   └── 48px tall, hairline bottom border, glass surface.
//       Clock ticks every second using tabular figures so digits
//       don't jump as they change.

const VIEW_TITLES: Record<ViewId, string> = {
  home: "Home",
  finance: "Finance",
  calendar: "Calendar",
  tasks: "Tasks",
  settings: "Settings",
};

export function TopBar() {
  const { activeView, setCommandPaletteOpen, user } = useOs();
  const [now, setNow] = useState<Date | null>(null);

  // Tick the clock every second. Initial state is null on the server
  // (Date isn't deterministic during SSR), then set on the client to
  // avoid hydration mismatches between the SSR'd HTML (with "--:--")
  // and the first client render (with real time).
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="relative z-30 flex h-12 items-center justify-between border-b border-line-subtle bg-surface-base/60 px-4 backdrop-blur-xl">
      {/* Left — active view title + OS wordmark */}
      <div className="flex items-center gap-3">
        <h1 className="text-[13px] font-medium tracking-tight text-ink-primary">
          {VIEW_TITLES[activeView]}
        </h1>
        <span className="text-ink-quaternary">·</span>
        <span className="wordmark text-[10px] tracking-cinematic text-ink-tertiary">
          NEGM OS
        </span>
      </div>

      {/* Center — command palette trigger (responsive) */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        aria-label="Open command palette (⌘K)"
        className="group flex items-center gap-2.5 rounded-md border border-line-subtle bg-surface-panel/60 px-3 py-1.5 text-[12px] text-ink-tertiary transition-colors hover:border-line-strong hover:bg-surface-elevated hover:text-ink-secondary"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span className="hidden sm:inline">Search</span>
        <span className="hidden items-center gap-0.5 text-ink-quaternary sm:flex">
          <Command className="h-3 w-3" strokeWidth={1.5} />
          <kbd className="font-mono text-[10px] tabular">K</kbd>
        </span>
      </button>

      {/* Right — clock + date + user chip */}
      <div className="flex items-center gap-4">
        {/* Clock + date — hidden on very small screens */}
        <div className="hidden items-center gap-3 sm:flex">
          <span className="font-mono text-[12px] tabular text-ink-secondary">
            {now ? formatTime(now) : "--:--"}
          </span>
          <span className="text-ink-quaternary">·</span>
          <span className="font-mono text-[12px] tabular text-ink-tertiary">
            {now
              ? formatDate(now, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </span>
        </div>

        {/* User chip with online indicator dot */}
        <div className="relative">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-line-emerald/40 bg-emerald-500/10">
            <span className="font-mono text-[9px] font-medium tracking-wide text-emerald-300">
              {user.initials}
            </span>
          </div>
          {/* Online indicator — emerald dot in the bottom-right corner,
              with a ring matching the top bar's bg color so it appears
              "cut out" from the avatar circle. */}
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-surface-base/60" />
        </div>
      </div>
    </header>
  );
}
