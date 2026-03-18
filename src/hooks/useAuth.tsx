import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type AppRole = "admin" | "user";
type PlanType = "free" | "individual" | "professional" | "enterprise" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  plan: PlanType;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, accountType?: string, telefone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshPlan: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [plan, setPlan] = useState<PlanType>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
            fetchUserPlan(session.user.id);
          }, 0);
        } else {
          setRoles([]);
          setPlan(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([
          fetchUserRoles(session.user.id),
          fetchUserPlan(session.user.id),
        ]).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!error && data) {
      setRoles(data.map((r) => r.role as AppRole));
    }
  };

  const fetchUserPlan = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("id", userId)
      .single();

    if (!error && data) {
      const rawPlan = data.subscription_plan;
      if (rawPlan === "individual" || rawPlan === "professional" || rawPlan === "enterprise") {
        setPlan(rawPlan);
      } else if (rawPlan === "free" || !rawPlan) {
        setPlan("free");
      } else {
        setPlan("free");
      }
    }
  };

  const refreshPlan = async () => {
    if (user) {
      await fetchUserPlan(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, accountType: string = "usuario", telefone?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, account_type: accountType, telefone },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setPlan(null);
    queryClient.clear();
  };

  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, roles, isAdmin, plan, signIn, signUp, signOut, refreshPlan }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
