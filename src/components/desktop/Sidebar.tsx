"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  LayoutGrid,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useOs, type ViewId } from "@/store/os-context";
import { cn, OS_NAME } from "@/lib/utils";

// ============================================================
// Sidebar — the primary OS navigation
// ============================================================
//
// Visual contract:
//   - 224px wide when expanded, 64px when collapsed (animates)
//   - Glass surface: surface-base/80 + backdrop-blur-xl
//   - Hairline right border separates it from main content
//   - Active item: emerald-500/10 background, emerald text, and a
//     2px emerald bar on the left edge that slides between items
//   - Keyboard shortcuts: ⌘1-5 switch views, ⌘B toggles collapse
//     (⌘B is registered globally in os-context.tsx)

interface NavItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  shortcut: string; // displayed hint, e.g. "⌘1"
  shortcutKey: string; // raw key for the keyboard handler, e.g. "1"
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: LayoutGrid,
    shortcut: "⌘1",
    shortcutKey: "1",
  },
  {
    id: "finance",
    label: "Finance",
    icon: Wallet,
    shortcut: "⌘2",
    shortcutKey: "2",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    shortcut: "⌘3",
    shortcutKey: "3",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: ListTodo,
    shortcut: "⌘4",
    shortcutKey: "4",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    shortcut: "⌘5",
    shortcutKey: "5",
  },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar, user } =
    useOs();

  // ⌘1-5 keyboard shortcuts to switch views.
  // These coexist with the global ⌘K / ⌘B shortcuts registered in
  // os-context.tsx — different keys, no conflicts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const item = NAV_ITEMS.find((n) => n.shortcutKey === e.key);
      if (item) {
        e.preventDefault();
        setActiveView(item.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setActiveView]);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 224 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative z-20 flex h-full flex-col border-r border-line-subtle bg-surface-base/80 backdrop-blur-xl",
        sidebarCollapsed ? "px-2" : "px-3",
      )}
    >
      {/* Wordmark + collapse toggle */}
      <div className="flex h-12 items-center justify-between">
        {sidebarCollapsed ? (
          <button
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            title="Expand sidebar (⌘B)"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink-primary"
          >
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
          </button>
        ) : (
          <>
            <span className="wordmark text-[11px] font-light tracking-cinematic text-ink-secondary">
              {OS_NAME}
            </span>
            <button
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar (⌘B)"
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink-primary"
            >
              <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      {/* Nav items */}
      <nav className="mt-2 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={activeView === item.id}
            collapsed={sidebarCollapsed}
            onClick={() => setActiveView(item.id)}
          />
        ))}
      </nav>

      {/* Footer — user identity */}
      <div className="mt-auto pt-3">
        {sidebarCollapsed ? (
          <div
            title={user.name}
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-line-emerald/40 bg-emerald-500/10"
          >
            <span className="font-mono text-[10px] font-medium tracking-wide text-emerald-300">
              {user.initials}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-emerald/40 bg-emerald-500/10">
              <span className="font-mono text-[10px] font-medium tracking-wide text-emerald-300">
                {user.initials}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-ink-primary">
                {user.name}
              </p>
              <p className="truncate text-[10px] text-ink-tertiary">
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

// --- Sidebar item ---------------------------------------------------------

interface SidebarItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function SidebarItem({ item, active, collapsed, onClick }: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-all",
        collapsed ? "justify-center" : "justify-start",
        active
          ? "bg-emerald-500/10 text-emerald-300"
          : "text-ink-secondary hover:bg-surface-hover hover:text-ink-primary",
      )}
    >
      {/*
        Active indicator — a 2px emerald bar on the left edge.
        Uses Motion's layoutId so it slides smoothly between items
        when the active view changes. The layoutId is shared across
        all SidebarItem instances; Motion animates between the
        unmounting item's position and the mounting item's position.
      */}
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-emerald-400 shadow-glow-sm"
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active
            ? "text-emerald-300"
            : "text-ink-tertiary group-hover:text-ink-secondary",
        )}
        strokeWidth={1.5}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{item.label}</span>
          <kbd
            className={cn(
              "font-mono text-[10px] tabular transition-colors",
              active
                ? "text-emerald-300/60"
                : "text-ink-quaternary group-hover:text-ink-tertiary",
            )}
          >
            {item.shortcut}
          </kbd>
        </>
      )}
    </button>
  );
}
