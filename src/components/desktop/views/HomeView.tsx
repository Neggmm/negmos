"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Clock,
  ListTodo,
  Plus,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useOs } from "@/store/os-context";
import {
  CALENDAR_EVENTS,
  CURRENT_BALANCE,
  MONTHLY_SUMMARY,
  RECENT_ACTIVITY,
  SAVINGS_BALANCE,
  TOTAL_INCOMING,
  TOTAL_OUTSTANDING,
  type ActivityKind,
  type EventType,
} from "@/lib/mock-data";
import {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatTime,
  isToday,
  isTomorrow,
  WELCOME_NAME,
} from "@/lib/utils";

// ============================================================
// HomeView — the personalized desktop dashboard
// ============================================================
//
// Layout (top → bottom):
//   1. Hero — greeting + live clock + long date
//   2. Stat cards (4 across on desktop) — balance, savings,
//      outstanding, incoming. Balance has a sparkline.
//   3. Two-column — upcoming schedule + recent activity
//   4. Quick actions row
//   5. Subtle demo-data disclaimer
//
// Each section fades in with a small staggered delay so the
// dashboard "loads" cinematically when the user enters Home.

export function HomeView() {
  const { setActiveView } = useOs();
  const [now, setNow] = useState<Date | null>(null);

  // Tick the clock every second. Initial state is null on the
  // server to avoid hydration mismatches (see TopBar.tsx).
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Compute greeting from hour of day
  const hour = now?.getHours() ?? 12;
  const greeting =
    hour < 5
      ? "Good night"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";

  // Sort upcoming events: those starting within the last hour or in
  // the future, take the next 4.
  const nowMs = now?.getTime() ?? Date.now();
  const upcoming = CALENDAR_EVENTS.filter(
    (e) => new Date(e.start).getTime() >= nowMs - 60 * 60 * 1000,
  )
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 4);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6 sm:p-10">
      {/* Hero — greeting + live clock + date */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-quaternary">
          Overview
        </p>
        <h1 className="text-3xl font-light tracking-tight text-ink-primary sm:text-4xl">
          {greeting},{" "}
          <span className="text-emerald-300">{WELCOME_NAME}</span>
        </h1>
        {now && (
          <p className="mt-1 flex items-center gap-2 text-[14px] text-ink-secondary">
            <span className="font-mono tabular text-emerald-300/80">
              {formatTime(now)}
            </span>
            <span className="text-ink-quaternary">·</span>
            <span>
              {formatDate(now, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </p>
        )}
      </motion.section>

      {/* Stat cards */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <StatCard
          label="Current Balance"
          value={formatCurrency(CURRENT_BALANCE)}
          icon={Wallet}
          accent="emerald"
          sparkline={MONTHLY_SUMMARY.trend}
        />
        <StatCard
          label="Savings"
          value={formatCurrency(SAVINGS_BALANCE)}
          icon={TrendingUp}
        />
        <StatCard
          label="Outstanding Debts"
          value={formatCurrency(TOTAL_OUTSTANDING)}
          icon={ArrowDownLeft}
          accent="warning"
          onClick={() => setActiveView("finance")}
        />
        <StatCard
          label="Expected Incoming"
          value={formatCurrency(TOTAL_INCOMING)}
          icon={ArrowUpRight}
          accent="emerald"
          onClick={() => setActiveView("finance")}
        />
      </motion.section>

      {/* Two-column — upcoming schedule + recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col rounded-xl border border-line-subtle bg-surface-panel/40 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays
                className="h-4 w-4 text-emerald-300"
                strokeWidth={1.5}
              />
              <h2 className="text-[13px] font-medium text-ink-primary">
                Upcoming Schedule
              </h2>
            </div>
            <button
              onClick={() => setActiveView("calendar")}
              className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary transition-colors hover:text-emerald-300"
            >
              View all
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {upcoming.map((event) => {
              const start = new Date(event.start);
              const dayLabel = isToday(start)
                ? "Today"
                : isTomorrow(start)
                  ? "Tomorrow"
                  : formatDate(start, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
              return (
                <li
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover/40"
                >
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md border border-line-subtle bg-surface-elevated">
                    <span className="font-mono text-[8px] uppercase leading-none text-ink-tertiary">
                      {formatDate(start, { month: "short" }).slice(0, 3)}
                    </span>
                    <span className="font-mono text-[13px] font-medium leading-none text-ink-primary tabular">
                      {start.getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink-primary">
                      {event.title}
                    </p>
                    <p className="truncate text-[11px] text-ink-tertiary">
                      {dayLabel} · {formatTime(start)}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <EventTypeBadge type={event.type} />
                </li>
              );
            })}
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col rounded-xl border border-line-subtle bg-surface-panel/40 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-300" strokeWidth={1.5} />
            <h2 className="text-[13px] font-medium text-ink-primary">
              Recent Activity
            </h2>
          </div>
          <ul className="flex flex-col gap-1">
            {RECENT_ACTIVITY.slice(0, 6).map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2"
              >
                <ActivityIcon kind={item.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink-secondary">
                    {item.description}
                  </p>
                  <p className="text-[11px] text-ink-quaternary">
                    {formatRelativeTime(item.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      {/* Quick actions */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center gap-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary">
          Quick Actions
        </span>
        <QuickAction
          label="Open Finance"
          onClick={() => setActiveView("finance")}
        />
        <QuickAction
          label="Open Calendar"
          onClick={() => setActiveView("calendar")}
        />
        <QuickAction
          label="Open Tasks"
          onClick={() => setActiveView("tasks")}
        />
        <QuickAction
          label="Open Settings"
          onClick={() => setActiveView("settings")}
        />
      </motion.section>

      {/* Demo data disclaimer — subtle but present */}
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-quaternary">
        <span className="inline-block h-1 w-1 rounded-full bg-amber-400/60" />
        Demo data · Not connected to a real database
      </p>
    </div>
  );
}

// --- Stat card ------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "emerald" | "warning" | "default";
  sparkline?: number[];
  onClick?: () => void;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = "default",
  sparkline,
  onClick,
}: StatCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-panel/40 p-4 text-left transition-all",
        onClick
          ? "cursor-pointer hover:border-line-strong hover:bg-surface-panel/70 hover:shadow-elev-2"
          : "cursor-default",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-ink-tertiary">
          {label}
        </span>
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            accent === "emerald"
              ? "text-emerald-300"
              : accent === "warning"
                ? "text-status-warning"
                : "text-ink-tertiary",
          )}
          strokeWidth={1.5}
        />
      </div>
      <span className="font-mono text-[20px] font-light tabular text-ink-primary">
        {value}
      </span>
      {sparkline && <Sparkline data={sparkline} />}
    </button>
  );
}

// --- Sparkline (inline SVG, no charting library) --------------------------

function Sparkline({ data }: { data: number[] }) {
  const w = 80;
  const h = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);

  // Build points list once
  const points = data.map((d, i) => {
    const x = i * step;
    const y = h - ((d - min) / range) * h;
    return { x, y };
  });

  // Line path: M x,y L x,y L x,y ...
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  // Area path: line + close to bottom-right + bottom-left
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;

  const polylinePoints = points
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id="sparkline-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0)" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkline-grad)" />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="rgba(52,211,153,0.8)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// --- Event type badge -----------------------------------------------------

const EVENT_TYPE_STYLES: Record<EventType, string> = {
  shift: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  lecture: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  appointment: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  personal: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  reminder: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

function EventTypeBadge({ type }: { type: EventType }) {
  const cls =
    EVENT_TYPE_STYLES[type] ??
    "bg-surface-elevated text-ink-tertiary border-line-subtle";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-widest",
        cls,
      )}
    >
      {type}
    </span>
  );
}

// --- Activity icon --------------------------------------------------------

const ACTIVITY_ICONS: Record<
  ActivityKind,
  { icon: LucideIcon; color: string }
> = {
  payment: {
    icon: ArrowDownLeft,
    color: "text-emerald-300 bg-emerald-500/10",
  },
  debt: {
    icon: ArrowUpRight,
    color: "text-status-warning bg-amber-500/10",
  },
  task: { icon: ListTodo, color: "text-blue-300 bg-blue-500/10" },
  calendar: {
    icon: CalendarDays,
    color: "text-purple-300 bg-purple-500/10",
  },
  system: {
    icon: Activity,
    color: "text-ink-tertiary bg-surface-elevated",
  },
};

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  const { icon: Icon, color } = ACTIVITY_ICONS[kind];
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        color,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
    </div>
  );
}

// --- Quick action chip ----------------------------------------------------

function QuickAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-line-subtle bg-surface-panel/40 px-3 py-1.5 text-[12px] text-ink-secondary transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
    >
      <Plus className="h-3 w-3" strokeWidth={1.5} />
      {label}
    </button>
  );
}
