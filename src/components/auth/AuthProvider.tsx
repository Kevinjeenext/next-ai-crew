/**
 * Auth Context Provider — global auth state management.
 *
 * Handles Supabase auth state including OAuth callback transitions.
 * Key: does NOT treat transient null sessions during callback as sign-out.
 */
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  orgId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  orgId: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();

      if (!mounted) return;

      console.log("[AuthProvider] Initial session:", !!initialSession, initialSession?.user?.email);

      if (initialSession) {
        setSession(initialSession);
        fetchOrgId(initialSession.access_token);
      }

      initializedRef.current = true;
      setLoading(false);
    };

    init();

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      console.log("[AuthProvider] Auth event:", event, "session:", !!newSession);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(newSession);
        if (newSession) {
          fetchOrgId(newSession.access_token);
        }
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setOrgId(null);
        setLoading(false);
      } else if (event === "INITIAL_SESSION") {
        // Only update if we have a session — don't clear existing session
        if (newSession) {
          setSession(newSession);
          fetchOrgId(newSession.access_token);
        }
        setLoading(false);
      }
      // Ignore other events that might have null session transiently
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrgId = async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrgId(data.org_id);
        console.log("[AuthProvider] Org ID:", data.org_id);
      } else {
        console.log("[AuthProvider] /api/auth/me failed:", res.status);
      }
    } catch (err) {
      console.log("[AuthProvider] /api/auth/me error:", err);
      // Non-fatal: don't sign out on org fetch failure
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setOrgId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        orgId,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
