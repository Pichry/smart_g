import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ApiError, usersApi, type PlanInfo, type PlanName } from "./api";
import { useAuth } from "./AuthContext";

/**
 * Global plan + capabilities state. Pages call usePlan() to read; the
 * SubscriptionPage calls upgrade() to switch and the new state propagates
 * everywhere instantly — sidebar, scan page, answer keys page.
 *
 * Without this, plan changes only show up when you navigate to a fresh
 * page. With it, switching plans on the Subscription page locks/unlocks
 * features across the whole app in real time.
 */
interface PlanContextValue {
  plan: PlanInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  upgrade: (plan: PlanName) => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setPlan(null); return; }
    setLoading(true);
    setError(null);
    try {
      const p = await usersApi.plan();
      setPlan(p);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Whenever the user changes (login / logout), refetch plan.
  useEffect(() => { refresh(); }, [refresh]);

  const upgrade = useCallback(async (newPlan: PlanName) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await usersApi.upgrade(newPlan);
      setPlan(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not switch plans");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PlanContext.Provider value={{ plan, loading, error, refresh, upgrade }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used inside <PlanProvider>");
  return ctx;
}
