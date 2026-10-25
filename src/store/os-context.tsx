"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { WELCOME_NAME } from "@/lib/utils";

// ============================================================
// NEGM OS — Global OS state
// ============================================================
//
// This context is the single source of truth for three slices of
// OS-wide state:
//
//   1. Phase    — which screen we're on (boot | pin | desktop)
//   2. Auth     — whether the user is signed in (stub for milestone 1;
//                 replaced by Supabase Auth state in milestone 2)
//   3. Desktop  — active view, sidebar collapse, command palette open
//
// Every component under <OsProvider> can read or update any of these
// without prop drilling. The provider also registers global keyboard
// shortcuts so any component can rely on them being wired.

// --- Types ----------------------------------------------------------------

export type Phase = "boot" | "pin" | "desktop";

export type ViewId = "home" | "finance" | "calendar" | "tasks" | "settings";

export interface OsUser {
  name: string;
  initials: string;
  role: string;
}

interface OsState {
  // Phase machine
  phase: Phase;
  setPhase: (p: Phase) => void;

  // Auth (stub for milestone 1 — wired to Supabase Auth in milestone 2)
  isAuthenticated: boolean;
  user: OsUser;
  signIn: () => void;
  signOut: () => void;

  // Desktop navigation
  activeView: ViewId;
  setActiveView: (v: ViewId) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

// --- Context ---------------------------------------------------------------

const OsContext = createContext<OsState | null>(null);

/**
 * useOs — read or update OS-wide state.
 *
 * Must be called from a component rendered inside <OsProvider>.
 * Throws on misuse so a missing provider never silently breaks
 * the OS — it fails loud during development, never in production.
 */
export function useOs(): OsState {
  const ctx = useContext(OsContext);
  if (!ctx) {
    throw new Error("useOs must be used within an <OsProvider>");
  }
  return ctx;
}

// --- Provider -------------------------------------------------------------

interface OsProviderProps {
  children: ReactNode;
}

export function OsProvider({ children }: OsProviderProps) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [activeView, setActiveView] = useState<ViewId>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Static user identity. In milestone 2 this becomes the Supabase user
  // object, but the shape stays the same so views don't need to change.
  const user = useMemo<OsUser>(
    () => ({
      name: WELCOME_NAME,
      initials: "DN",
      role: "Owner",
    }),
    [],
  );

  const signIn = useCallback(() => setIsAuthenticated(true), []);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setPhase("pin");
    setCommandPaletteOpen(false);
    setActiveView("home");
    setSidebarCollapsed(false);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);
  const toggleCommandPalette = useCallback(
    () => setCommandPaletteOpen((o) => !o),
    [],
  );

  // Global keyboard shortcuts — registered once for the whole OS.
  //
  //   ⌘K / Ctrl+K  — toggle command palette
  //   ⌘B / Ctrl+B  — toggle sidebar collapse
  //   Escape       — close the command palette if it's open
  //
  // These are registered globally because the command palette and
  // sidebar state live in this context, not in any single component.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((o) => !o);
        return;
      }
      if (mod && key === "b") {
        e.preventDefault();
        setSidebarCollapsed((c) => !c);
        return;
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Memoize the value object so consumers only re-render when a slice
  // they actually use changes. The setState setters and useCallback
  // callbacks are stable across renders, so only the primitive state
  // values trigger a new object reference.
  const value = useMemo<OsState>(
    () => ({
      phase,
      setPhase,
      isAuthenticated,
      user,
      signIn,
      signOut,
      activeView,
      setActiveView,
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      commandPaletteOpen,
      setCommandPaletteOpen,
      toggleCommandPalette,
    }),
    [
      phase,
      isAuthenticated,
      user,
      signIn,
      signOut,
      activeView,
      sidebarCollapsed,
      toggleSidebar,
      commandPaletteOpen,
      toggleCommandPalette,
    ],
  );

  return <OsContext.Provider value={value}>{children}</OsContext.Provider>;
}
