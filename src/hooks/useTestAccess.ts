import { useSubscription } from "./useSubscription";

type TestAccessResult = {
  isFree: boolean;
  isLoading: boolean;
  plan: string | null;
};

/**
 * Determines if a test is free for the current user based on their subscription plan.
 *
 * Rules:
 * - Enterprise (enterprise): ALL tests free
 * - Professional (professional): ALL tests free EXCEPT MAPSO report generation
 * - Individual (individual) / Free (free) / null: normal charging
 */
export function useTestAccess(testSlug: string): TestAccessResult {
  const { plan, isActive, isLoading } = useSubscription();

  if (isLoading) {
    return { isFree: false, isLoading: true, plan };
  }

  // Enterprise plan: everything is free
  if (plan === "enterprise" && isActive) {
    return { isFree: true, isLoading: false, plan };
  }

  // Professional plan: all tests free EXCEPT mapso report
  if (plan === "professional" && isActive) {
    const isFree = testSlug !== "mapso";
    return { isFree, isLoading: false, plan };
  }

  // Individual / Free / no plan: normal charging
  return { isFree: false, isLoading: false, plan };
}
