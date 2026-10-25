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
// Auth flow (multi-account):
//   - On mount: getSession() — if session exists, read user info
//     from session.user.user_metadata (or fall back to email),
//     advance to desktop (skip boot + login).
//   - On client-side signInWithPassword: onAuthStateChange fires
//     SIGNED_IN. We read user info from session.user and update
//     the OsProvider's `user` state, then advance to desktop.
//   - On signOut: onAuthStateChange fires SIGNED_OUT. We reset
//     user to defaults and return to login screen.

// --- Types ----------------------------------------------------------------

export type Phase = "boot" | "pin" | "desktop";

export type ViewId = "home" | "finance" | "calendar" | "tasks" | "settings";

export interface OsUser {
  name: string;
  initials: string;
  role: string;
  email?: string;
}

interface OsState {
  phase: Phase;
  setPhase: (p: Phase) => void;

  isAuthenticated: boolean;
  user: OsUser;
  signIn: () => void;
  signOut: () => void;

  activeView: ViewId;
  setActiveView: (v: ViewId) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

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

// --- Helpers ---------------------------------------------------------------

const DEFAULT_USER: OsUser = {
  name: WELCOME_NAME,
  initials: "DN",
  role: "Owner",
};

/**
 * makeUserFromSession — derive display info from a Supabase session.
 *
 * Priority:
 *   1. user_metadata.display_name / .initials / .role (if set in Supabase dashboard)
 *   2. profile table fields (queried separately in milestone 2.2)
 *   3. Email-derived fallback (local part + first 2 chars)
 */
function makeUserFromSession(sessionUser: {
  email?: string;
  user_metadata?: Record<string, unknown> | null;
}): OsUser {
  const email = sessionUser.email ?? "";
  const metadata = sessionUser.user_metadata ?? {};
  const localPart = email.split("@")[0] ?? "User";

  return {
    name:
      (metadata.display_name as string | undefined) ||
      localPart.charAt(0).toUpperCase() + localPart.slice(1) ||
      "User",
    initials:
      (metadata.initials as string | undefined) ||
      localPart.slice(0, 2).toUpperCase() ||
      "U",
    role: (metadata.role as string | undefined) || "User",
    email,
  };
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
  const [user, setUser] = useState<OsUser>(DEFAULT_USER);

  // On mount, check for an existing Supabase session. If found,
  // skip the boot screen and go straight to the desktop.
  //
  // Also subscribe to onAuthStateChange for client-side sign-in and
  // sign-out events.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(makeUserFromSession(session.user));
        setIsAuthenticated(true);
        setPhase("desktop");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        setUser(makeUserFromSession(session.user));
        setIsAuthenticated(true);
        setPhase("desktop");
      } else if (event === "SIGNED_OUT") {
        setUser(DEFAULT_USER);
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
    // Fire-and-forget — the onAuthStateChange listener handles state cleanup.
    void supabase.auth.signOut();
  }, []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);
  const toggleCommandPalette = useCallback(
    () => setCommandPaletteOpen((o) => !o),
    [],
  );

  // Global keyboard shortcuts
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
