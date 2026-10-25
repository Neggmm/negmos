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
import { supabase } from "@/lib/supabase/client";
import { WELCOME_NAME } from "@/lib/utils";

// ============================================================
// NEGM OS — Global OS state
// ============================================================
//
// This context is the single source of truth for three slices of
// OS-wide state:
//
//   1. Phase    — which screen we're on (boot | pin | desktop)
//   2. Auth     — synced with Supabase Auth session state
//   3. Desktop  — active view, sidebar collapse, command palette
//
// Auth flow:
//   - On mount: call supabase.auth.getSession(). If session exists,
//     skip boot + pin and go straight to desktop. The boot is a
//     "cold start" intro — once the user has a session, they don't
//     need to see it again.
//   - On verifyPin server action success: PinEntry calls signIn()
//     which flips isAuthenticated + setPhase("desktop").
//   - On Lock OS click: signOut() calls supabase.auth.signOut()
//     client-side. This triggers onAuthStateChange (SIGNED_OUT),
//     which resets the OS state.
//
// Note: server-side sign-in (via the verifyPin server action)
// does NOT trigger onAuthStateChange on the client — only client-
// side auth calls do. So we manually update state in signIn().
// Sign-out IS client-side, so onAuthStateChange fires naturally.

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

  // Auth (synced with Supabase Auth session)
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

  const user = useMemo<OsUser>(
    () => ({
      name: WELCOME_NAME,
      initials: "DN",
      role: "Owner",
    }),
    [],
  );

  // On mount, check for an existing Supabase session. If found,
  // skip the boot screen and go straight to the desktop — the user
  // is already authenticated from a previous visit.
  //
  // Also subscribe to onAuthStateChange for client-side sign-out
  // events. (Server-side sign-in via verifyPin doesn't trigger this
  // listener; PinEntry manually calls signIn() after success.)
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setIsAuthenticated(true);
        setPhase("desktop");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setPhase("pin");
        setCommandPaletteOpen(false);
        setActiveView("home");
        setSidebarCollapsed(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    // Fire-and-forget — the onAuthStateChange listener handles
    // the state cleanup when signOut completes. Using `void`
    // so the function signature stays `() => void` (works with
    // onClick handlers that expect void return).
    void supabase.auth.signOut();
  }, []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);
  const toggleCommandPalette = useCallback(
    () => setCommandPaletteOpen((o) => !o),
    [],
  );

  // Global keyboard shortcuts — registered once for the whole OS.
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
