"use client";

import { motion } from "motion/react";
import {
  Bell,
  Fingerprint,
  Lock,
  Moon,
  Palette,
  Send,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useOs } from "@/store/os-context";
import { cn } from "@/lib/utils";

// ============================================================
// SettingsView — preferences interface
// ============================================================
//
// Sections (top → bottom):
//   1. Profile       — name, role, owner badge
//   2. Appearance    — cinematic dark (locked on), accent (emerald)
//   3. Security       — PIN management (milestone 2)
//   4. Integrations   — Telegram (not connected), push (milestone 2)
//   5. Session        — Lock OS button (returns to PIN screen)
//   6. About          — NEGM OS · v0.1.0 · Milestone 1
//
// Locked rows are visibly dimmed (opacity-60) and tagged with an
// amber "Coming in milestone 2" pill, so it's always clear which
// features are scaffolded vs. functional.

export function SettingsView() {
  const { user, signOut } = useOs();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 sm:p-10">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-quaternary">
          Section
        </p>
        <h1 className="text-3xl font-light tracking-tight text-ink-primary sm:text-4xl">
          Settings
        </h1>
        <p className="flex items-center gap-2 text-[13px] text-ink-tertiary">
          <span className="inline-block h-1 w-1 rounded-full bg-amber-400/60" />
          Preferences · Some features land in milestone 2
        </p>
      </motion.section>

      {/* Profile */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-4 rounded-xl border border-line-subtle bg-surface-panel/40 p-5"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line-emerald/40 bg-emerald-500/10">
          <span className="font-mono text-[14px] font-medium tracking-wide text-emerald-300">
            {user.initials}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-ink-primary">
            {user.name}
          </p>
          <p className="text-[12px] text-ink-tertiary">{user.role}</p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] uppercase tracking-widest text-emerald-300">
          Owner
        </span>
      </motion.section>

      {/* Appearance */}
      <SettingsGroup
        title="Appearance"
        description="Theme and visual preferences"
        icon={Palette}
      >
        <SettingsRow
          icon={Moon}
          label="Cinematic Dark"
          description="The signature NEGM OS dark theme with emerald accents"
        >
          <TogglePill label="On" />
        </SettingsRow>
        <SettingsRow
          icon={Palette}
          label="Accent Color"
          description="Emerald is the only available accent for milestone 1"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-tertiary">
            Emerald
          </span>
        </SettingsRow>
      </SettingsGroup>

      {/* Security — PIN management (milestone 2) */}
      <SettingsGroup
        title="Security"
        description="PIN, authentication, and session"
        icon={Shield}
      >
        <SettingsRow
          icon={Fingerprint}
          label="Change PIN"
          description="Server-side PIN update via Supabase"
          locked
          lockedLabel="Coming in milestone 2"
        />
        <SettingsRow
          icon={Lock}
          label="Session Timeout"
          description="Auto-lock after period of inactivity"
          locked
          lockedLabel="Coming in milestone 2"
        />
      </SettingsGroup>

      {/* Integrations — Telegram */}
      <SettingsGroup
        title="Integrations"
        description="External services connected to NEGM OS"
        icon={Send}
      >
        <SettingsRow
          icon={Send}
          label="Telegram Bot"
          description="Receive reminders and manage tasks via Telegram"
        >
          <StatusBadge status="disconnected" label="Not connected" />
        </SettingsRow>
        <SettingsRow
          icon={Bell}
          label="Push Notifications"
          description="Browser push for calendar reminders"
          locked
          lockedLabel="Coming in milestone 2"
        />
      </SettingsGroup>

      {/* Session — Lock OS */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-[13px] font-medium text-red-300 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
        >
          <Lock className="h-4 w-4" strokeWidth={1.5} />
          Lock OS
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-quaternary">
          Returns to the PIN entry screen
        </p>
      </motion.section>

      {/* About */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex flex-col items-center gap-1 pt-4"
      >
        <p className="wordmark text-[10px] tracking-cinematic text-ink-quaternary">
          NEGM OS
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-quaternary">
          v0.1.0 · Milestone 1
        </p>
      </motion.div>
    </div>
  );
}

// --- Settings group -------------------------------------------------------

function SettingsGroup({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col rounded-xl border border-line-subtle bg-surface-panel/40"
    >
      <div className="flex items-center gap-3 border-b border-line-subtle px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line-subtle bg-surface-elevated">
          <Icon className="h-4 w-4 text-emerald-300" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-[13px] font-medium text-ink-primary">{title}</h2>
          <p className="text-[11px] text-ink-tertiary">{description}</p>
        </div>
      </div>
      <div className="flex flex-col">{children}</div>
    </motion.section>
  );
}

// --- Settings row --------------------------------------------------------

function SettingsRow({
  icon: Icon,
  label,
  description,
  children,
  locked,
  lockedLabel,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  children?: React.ReactNode;
  locked?: boolean;
  lockedLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-line-subtle/50 px-5 py-3.5 first:border-t-0",
        locked ? "opacity-60" : "hover:bg-surface-hover/30",
      )}
    >
      <Icon
        className="h-4 w-4 shrink-0 text-ink-tertiary"
        strokeWidth={1.5}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-ink-primary">{label}</p>
        <p className="truncate text-[11px] text-ink-tertiary">{description}</p>
      </div>
      {locked && lockedLabel ? (
        <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[9px] uppercase tracking-widest text-amber-300/80">
          {lockedLabel}
        </span>
      ) : (
        children
      )}
    </div>
  );
}

// --- Toggle pill ---------------------------------------------------------

function TogglePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {label}
    </span>
  );
}

// --- Status badge --------------------------------------------------------

function StatusBadge({
  status,
  label,
}: {
  status: "connected" | "disconnected" | "warning";
  label: string;
}) {
  const styles = {
    connected: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    disconnected:
      "border-line-subtle bg-surface-elevated text-ink-tertiary",
    warning: "border-amber-500/20 bg-amber-500/5 text-amber-300",
  } as const;
  const dotColor = {
    connected: "bg-emerald-400",
    disconnected: "bg-ink-quaternary",
    warning: "bg-amber-400",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest",
        styles[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[status])} />
      {label}
    </span>
  );
}
