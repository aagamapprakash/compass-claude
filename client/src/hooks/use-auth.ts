import { useEffect, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { User } from "@shared/models/auth";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState & { logout: () => Promise<void> } {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchProfile(data.session);
      } else {
        setIsLoading(false);
      }
    });

    // Keep in sync with Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setIsLoading(true);
        fetchProfile(newSession);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(activeSession: Session) {
    try {
      const res = await fetch("/api/auth/user", {
        headers: { Authorization: `Bearer ${activeSession.access_token}` },
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    logout,
  };
}
