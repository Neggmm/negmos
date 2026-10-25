"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import {
  CALENDAR_EVENTS,
  type CalendarEvent,
  type EventType,
} from "@/lib/mock-data";
import { cn, formatDate, formatTime } from "@/lib/utils";

// ============================================================
// CalendarView — day / week / month views
// ============================================================
//
// ⚠ Demo data — schedule is mock and not persisted.
//
// Three view modes:
//   Day   — hourly timeline (7 AM → 11 PM), events positioned by hour
//   Week  — 7-column grid, today's column highlighted
//   Month — 6-week calendar grid, today's cell highlighted
//
// Color coding (consistent across all views):
//   shift       → emerald  (clinic / work)
//   lecture     → blue     (university)
//   appointment → purple   (medical / professional)
//   personal    → orange   (gym, family, etc.)
//   reminder    → amber    (bills, renewals)
//
// Navigation: prev/next steps by 1 day, 1 week, or 1 month
// (depending on current view). "Today" jumps to today.

type CalendarViewMode = "day" | "week" | "month";

interface EventTypeStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const EVENT_TYPE_STYLES: Record<EventType, EventTypeStyle> = {
  shift: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  lecture: {
    bg: "bg-blue-500/10",
    text: "text-blue-300",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  appointment: {
    bg: "bg-purple-500/10",
    text: "text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
  personal: {
    bg: "bg-orange-500/10",
    text: "text-orange-300",
    border: "border-orange-500/30",
    dot: "bg-orange-400",
  },
  reminder: {
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
};

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  shift: "Shift",
  lecture: "Lecture",
  appointment: "Appointment",
  personal: "Personal",
  reminder: "Reminder",
};

// --- Date helpers (no date-fns dependency for milestone 1) --------------

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  // Week starts Monday. JS getDay: 0=Sunday, 1=Monday, ..., 6=Saturday
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHourLabel(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

// --- Main component -------------------------------------------------------

export function CalendarView() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [focusDate, setFocusDate] = useState<Date>(new Date());

  const goPrev = () => {
    if (viewMode === "day") setFocusDate((d) => addDays(d, -1));
    else if (viewMode === "week") setFocusDate((d) => addDays(d, -7));
    else setFocusDate((d) => addMonths(d, -1));
  };
  const goNext = () => {
    if (viewMode === "day") setFocusDate((d) => addDays(d, 1));
    else if (viewMode === "week") setFocusDate((d) => addDays(d, 7));
    else setFocusDate((d) => addMonths(d, 1));
  };
  const goToday = () => setFocusDate(new Date());

  const title = useMemo(() => {
    if (viewMode === "month") {
      return formatDate(focusDate, { month: "long", year: "numeric" });
    }
    if (viewMode === "week") {
      const start = startOfWeek(focusDate);
      const end = addDays(start, 6);
      return `${formatDate(start, { month: "short", day: "numeric" })} – ${formatDate(end, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return formatDate(focusDate, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [viewMode, focusDate]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 sm:p-10">
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
          Calendar
        </h1>
        <p className="flex items-center gap-2 text-[13px] text-ink-tertiary">
          <span className="inline-block h-1 w-1 rounded-full bg-amber-400/60" />
          Demo data · Schedule is not persisted
        </p>
      </motion.section>

      {/* Toolbar — view tabs + title + navigation */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-panel/40 p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-1 rounded-lg border border-line-subtle bg-surface-base/60 p-1">
          <ViewTab
            active={viewMode === "day"}
            onClick={() => setViewMode("day")}
            icon={Clock}
            label="Day"
          />
          <ViewTab
            active={viewMode === "week"}
            onClick={() => setViewMode("week")}
            icon={Columns3}
            label="Week"
          />
          <ViewTab
            active={viewMode === "month"}
            onClick={() => setViewMode("month")}
            icon={CalendarRange}
            label="Month"
          />
        </div>

        <p className="flex-1 text-center text-[13px] font-medium text-ink-primary">
          {title}
        </p>

        <div className="flex items-center justify-center gap-2 sm:justify-end">
          <button
            onClick={goPrev}
            aria-label="Previous"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line-subtle bg-surface-panel/60 text-ink-tertiary transition-colors hover:bg-surface-elevated hover:text-ink-primary"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={goToday}
            className="rounded-md border border-line-subtle bg-surface-panel/60 px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-ink-secondary transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            Today
          </button>
          <button
            onClick={goNext}
            aria-label="Next"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line-subtle bg-surface-panel/60 text-ink-tertiary transition-colors hover:bg-surface-elevated hover:text-ink-primary"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </motion.section>

      {/* View content — crossfades between modes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {viewMode === "day" && <DayView focusDate={focusDate} />}
          {viewMode === "week" && <WeekView focusDate={focusDate} />}
          {viewMode === "month" && <MonthView focusDate={focusDate} />}
        </motion.div>
      </AnimatePresence>

      {/* Legend — color key at the bottom */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-quaternary">
          Legend
        </span>
        {(Object.keys(EVENT_TYPE_STYLES) as EventType[]).map((type) => {
          const styles = EVENT_TYPE_STYLES[type];
          return (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 text-[11px] text-ink-tertiary"
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
              {EVENT_TYPE_LABEL[type]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// --- View tab -------------------------------------------------------------

function ViewTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all",
        active
          ? "bg-emerald-500/10 text-emerald-300 shadow-glow-sm"
          : "text-ink-tertiary hover:text-ink-secondary",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
      {label}
    </button>
  );
}

// --- Day view — hourly timeline ------------------------------------------

function DayView({ focusDate }: { focusDate: Date }) {
  const dayStart = startOfDay(focusDate);
  const dayEnd = addDays(dayStart, 1);

  const events = CALENDAR_EVENTS.filter((e) => {
    const start = new Date(e.start);
    return start >= dayStart && start < dayEnd;
  }).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  // Hours from 7 AM to 11 PM (17 hours)
  const hours = Array.from({ length: 17 }, (_, i) => i + 7);

  return (
    <div className="rounded-xl border border-line-subtle bg-surface-panel/40 p-4">
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <CalendarDays
            className="h-6 w-6 text-ink-quaternary"
            strokeWidth={1.5}
          />
          <p className="text-[13px] text-ink-tertiary">
            No events scheduled for this day.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {hours.map((hour) => {
            const hourStart = new Date(dayStart);
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(dayStart);
            hourEnd.setHours(hour + 1, 0, 0, 0);

            const eventsInHour = events.filter((e) => {
              const start = new Date(e.start);
              return start >= hourStart && start < hourEnd;
            });

            return (
              <div
                key={hour}
                className="flex gap-4 border-t border-line-subtle/50 py-2 first:border-t-0"
              >
                <div className="w-14 shrink-0 pt-1">
                  <span className="font-mono text-[10px] uppercase tabular text-ink-quaternary">
                    {formatHourLabel(hour)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  {eventsInHour.length === 0 ? (
                    <div className="h-8" />
                  ) : (
                    eventsInHour.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Week view — 7-column grid -------------------------------------------

function WeekView({ focusDate }: { focusDate: Date }) {
  const weekStart = startOfWeek(focusDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <div className="rounded-xl border border-line-subtle bg-surface-panel/40 p-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
        {days.map((day) => {
          const dayStart = startOfDay(day);
          const dayEnd = addDays(dayStart, 1);
          const events = CALENDAR_EVENTS.filter((e) => {
            const start = new Date(e.start);
            return start >= dayStart && start < dayEnd;
          }).sort(
            (a, b) =>
              new Date(a.start).getTime() - new Date(b.start).getTime(),
          );
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-h-[140px] flex-col gap-1.5 rounded-lg border p-2",
                isToday
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-line-subtle bg-surface-base/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-tertiary">
                  {formatDate(day, { weekday: "short" })}
                </span>
                <span
                  className={cn(
                    "font-mono text-[12px] tabular",
                    isToday
                      ? "font-medium text-emerald-300"
                      : "text-ink-secondary",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
              {events.length === 0 ? (
                <div className="flex-1" />
              ) : (
                <div className="flex flex-col gap-1">
                  {events.map((event) => (
                    <WeekEventPill key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Month view — 6-week calendar grid ----------------------------------

function MonthView({ focusDate }: { focusDate: Date }) {
  const monthStart = startOfMonth(focusDate);
  const today = new Date();

  // Build a 6-week grid starting from the Monday on or before the 1st
  const gridStart = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-xl border border-line-subtle bg-surface-panel/40 p-3">
      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 border-b border-line-subtle pb-2">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center font-mono text-[10px] uppercase tracking-widest text-ink-tertiary"
          >
            {day}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 pt-1">
        {days.map((day) => {
          const dayStart = startOfDay(day);
          const dayEnd = addDays(dayStart, 1);
          const events = CALENDAR_EVENTS.filter((e) => {
            const start = new Date(e.start);
            return start >= dayStart && start < dayEnd;
          });
          const inMonth = day.getMonth() === focusDate.getMonth();
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-h-[80px] flex-col gap-1 rounded-md border p-1.5",
                isToday
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : inMonth
                    ? "border-line-subtle/50 bg-surface-base/30"
                    : "border-transparent bg-transparent opacity-40",
              )}
            >
              <span
                className={cn(
                  "font-mono text-[11px] tabular",
                  isToday
                    ? "font-medium text-emerald-300"
                    : inMonth
                      ? "text-ink-secondary"
                      : "text-ink-quaternary",
                )}
              >
                {day.getDate()}
              </span>
              {events.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {events.slice(0, 3).map((event) => {
                    const styles = EVENT_TYPE_STYLES[event.type];
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "flex items-center gap-1 rounded px-1 py-0.5 text-[9px]",
                          styles.bg,
                          styles.text,
                        )}
                      >
                        <span
                          className={cn(
                            "h-1 w-1 shrink-0 rounded-full",
                            styles.dot,
                          )}
                        />
                        <span className="truncate">{event.title}</span>
                      </div>
                    );
                  })}
                  {events.length > 3 && (
                    <span className="px-1 text-[9px] text-ink-quaternary">
                      +{events.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Event card (Day view) -----------------------------------------------

function EventCard({ event }: { event: CalendarEvent }) {
  const styles = EVENT_TYPE_STYLES[event.type];
  const start = new Date(event.start);
  const end = new Date(event.end);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        styles.bg,
        styles.border,
      )}
    >
      <div
        className={cn(
          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
          styles.dot,
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-[13px] font-medium",
              styles.text,
            )}
          >
            {event.title}
          </p>
          <span
            className={cn(
              "shrink-0 font-mono text-[9px] uppercase tracking-widest opacity-70",
              styles.text,
            )}
          >
            {EVENT_TYPE_LABEL[event.type]}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] tabular text-ink-tertiary">
          <Clock className="h-3 w-3" strokeWidth={1.5} />
          {formatTime(start)} – {formatTime(end)}
        </p>
        {event.location && (
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-tertiary">
            <MapPin className="h-3 w-3" strokeWidth={1.5} />
            {event.location}
          </p>
        )}
      </div>
    </div>
  );
}

// --- Week event pill (compact) -------------------------------------------

function WeekEventPill({ event }: { event: CalendarEvent }) {
  const styles = EVENT_TYPE_STYLES[event.type];
  const start = new Date(event.start);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded border px-1.5 py-1",
        styles.bg,
        styles.border,
      )}
      title={`${event.title} · ${formatTime(start)}`}
    >
      <span
        className={cn("h-1 w-1 shrink-0 rounded-full", styles.dot)}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[10px] font-medium leading-tight",
            styles.text,
          )}
        >
          {event.title}
        </p>
        <p className="font-mono text-[9px] tabular leading-tight text-ink-tertiary">
          {formatTime(start)}
        </p>
      </div>
    </div>
  );
}
