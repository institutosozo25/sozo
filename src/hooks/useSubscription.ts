import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionState {
  plan: string | null;
  status: string | null;
  isActive: boolean;
  isLoading: boolean;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: null,
    status: null,
    isActive: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!user) {
      setState({ plan: null, status: null, isActive: false, isLoading: false });
      return;
    }

    const fetchSubscription = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_status")
        .eq("id", user.id)
        .single();

      setState({
        plan: data?.subscription_plan || null,
        status: data?.subscription_status || null,
        isActive: data?.subscription_status === "active",
        isLoading: false,
      });
    };

    fetchSubscription();
  }, [user]);

  return state;
}
