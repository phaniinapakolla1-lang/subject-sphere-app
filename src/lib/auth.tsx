import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USER, isDemo, stopDemo } from "@/lib/demo";

type Role = "admin" | "student" | null;

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  demo: boolean;
  role: Role;
  isAdmin: boolean;
  exitDemo: () => void;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  loading: true,
  demo: false,
  role: null,
  isAdmin: false,
  exitDemo: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    setDemo(isDemo());
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setRole(demo ? "student" : null);
      return;
    }
    let alive = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (!alive) return;
        const roles = (data ?? []).map((r) => r.role);
        setRole(roles.includes("admin") ? "admin" : "student");
      });
    return () => {
      alive = false;
    };
  }, [userId, demo]);

  const demoUser = demo && !session ? (DEMO_USER as unknown as User) : null;

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? demoUser,
        session,
        loading,
        demo: demo && !session,
        role,
        isAdmin: role === "admin",
        exitDemo: () => {
          stopDemo();
          setDemo(false);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useUserId() {
  return useAuth().user?.id ?? null;
}
