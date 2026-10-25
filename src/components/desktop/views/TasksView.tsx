"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ListTodo,
  Plus,
} from "lucide-react";
import { TASKS, type Task, type TaskPriority } from "@/lib/mock-data";
import { cn, formatRelativeTime, isToday } from "@/lib/utils";

// ============================================================
// TasksView — tasks and reminders
// ============================================================
//
// ⚠ Demo data — tasks are mock. Local toggle-complete works;
//   refresh resets. Persistence lands in milestone 2.
//
// Filter tabs: All / Pending / Completed (with live counts)
// Each task row: circle toggle, title, priority badge, due date
// Priority colors: urgent=red, high=orange, medium=blue, low=gray
// Due date coloring: overdue=red, today=amber, future=neutral

type FilterMode = "all" | "pending" | "completed";

interface PriorityStyle {
  bg: string;
  text: string;
  border: string;
}

const PRIORITY_STYLES: Record<TaskPriority, PriorityStyle> = {
  urgent: {
    bg: "bg-red-500/10",
    text: "text-red-300",
    border: "border-red-500/20",
  },
  high: {
    bg: "bg-orange-500/10",
    text: "text-orange-300",
    border: "border-orange-500/20",
  },
  medium: {
    bg: "bg-blue-500/10",
    text: "text-blue-300",
    border: "border-blue-500/20",
  },
  low: {
    bg: "bg-surface-elevated",
    text: "text-ink-tertiary",
    border: "border-line-subtle",
  },
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// Lower number = higher priority (sorts first)
const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [filter, setFilter] = useState<FilterMode>("pending");

  // Filter + sort. Pending: by priority asc, then due date asc.
  // Completed: by due date desc (most recent first as a proxy for
  // completion order, since we don't store completedAt yet).
  // All: same as pending but includes completed tasks.
  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "pending") list = tasks.filter((t) => !t.completed);
    else if (filter === "completed") list = tasks.filter((t) => t.completed);

    if (filter === "completed") {
      return [...list].sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return bTime - aTime;
      });
    }
    return [...list].sort((a, b) => {
      const aPrio = PRIORITY_ORDER[a.priority];
      const bPrio = PRIORITY_ORDER[b.priority];
      if (aPrio !== bPrio) return aPrio - bPrio;
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aTime - bTime;
    });
  }, [tasks, filter]);

  // Live counts for the filter tabs
  const counts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks],
  );

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 sm:p-10">
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
          Tasks
        </h1>
        <p className="flex items-center gap-2 text-[13px] text-ink-tertiary">
          <span className="inline-block h-1 w-1 rounded-full bg-amber-400/60" />
          Demo data · Local changes only · Refresh resets
        </p>
      </motion.section>

      {/* Toolbar — filter tabs + add task */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between gap-3 rounded-xl border border-line-subtle bg-surface-panel/40 p-3"
      >
        <div className="flex items-center gap-1 rounded-lg border border-line-subtle bg-surface-base/60 p-1">
          <FilterTab
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
            count={counts.all}
          />
          <FilterTab
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
            label="Pending"
            count={counts.pending}
          />
          <FilterTab
            active={filter === "completed"}
            onClick={() => setFilter("completed")}
            label="Completed"
            count={counts.completed}
          />
        </div>

        <button
          onClick={() => {}}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-subtle bg-surface-panel/40 px-3 py-1.5 text-[11px] text-ink-secondary transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <Plus className="h-3 w-3" strokeWidth={1.5} />
          Add task
        </button>
      </motion.section>

      {/* Task list */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col rounded-xl border border-line-subtle bg-surface-panel/40 p-2"
      >
        {filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {filtered.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>

      {/* Hint */}
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-quaternary">
        <span className="inline-block h-1 w-1 rounded-full bg-amber-400/60" />
        Click the circle to toggle completion
      </p>
    </div>
  );
}

// --- Filter tab -----------------------------------------------------------

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
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
      {label}
      <span
        className={cn(
          "font-mono text-[10px] tabular",
          active ? "text-emerald-300/70" : "text-ink-quaternary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

// --- Task row -------------------------------------------------------------

function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  const priority = PRIORITY_STYLES[task.priority];
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const dueLabel = due ? formatRelativeTime(due.toISOString()) : null;
  const overdue = due !== null && !task.completed && due.getTime() < Date.now();
  const dueToday = due !== null && isToday(due.toISOString());

  // Build the due-date prefix: "Overdue · " for past due, "Today · "
  // for today, otherwise empty. The relative time follows.
  const duePrefix = overdue
    ? "Overdue · "
    : dueToday && !task.completed
      ? "Today · "
      : "";

  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 border-t border-line-subtle/50 px-3 py-3 transition-colors first:border-t-0 hover:bg-surface-hover/30"
    >
      {/* Toggle circle */}
      <button
        onClick={onToggle}
        aria-label={task.completed ? "Mark as pending" : "Mark as completed"}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
          task.completed
            ? "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20"
            : "border-line-strong hover:border-emerald-500/40 hover:bg-emerald-500/5",
        )}
      >
        {task.completed && (
          <Check className="h-2.5 w-2.5 text-emerald-300" strokeWidth={2.5} />
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-[13px] leading-snug",
              task.completed
                ? "text-ink-tertiary line-through"
                : "text-ink-primary",
            )}
          >
            {task.title}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-widest",
              priority.bg,
              priority.text,
              priority.border,
            )}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-tertiary">
          {dueLabel && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-mono tabular",
                overdue
                  ? "text-status-danger"
                  : dueToday && !task.completed
                    ? "text-amber-300"
                    : "text-ink-tertiary",
              )}
            >
              <CalendarClock className="h-3 w-3" strokeWidth={1.5} />
              {duePrefix}
              {dueLabel}
            </span>
          )}
          {task.note && (
            <>
              <span className="text-ink-quaternary">·</span>
              <span className="truncate text-ink-tertiary">
                {task.note}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.li>
  );
}

// --- Empty state ---------------------------------------------------------

function EmptyState({ filter }: { filter: FilterMode }) {
  const message =
    filter === "completed"
      ? "No completed tasks yet."
      : filter === "pending"
        ? "No pending tasks. You're all caught up."
        : "No tasks. Add one to get started.";

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {filter === "pending" ? (
        <CheckCircle2
          className="h-6 w-6 text-emerald-300/60"
          strokeWidth={1.5}
        />
      ) : (
        <ListTodo className="h-6 w-6 text-ink-quaternary" strokeWidth={1.5} />
      )}
      <p className="text-[13px] text-ink-tertiary">{message}</p>
    </div>
  );
}
