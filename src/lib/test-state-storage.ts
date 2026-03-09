/**
 * Persist and restore in-progress test state to survive page reloads.
 * Keys are scoped per test slug to avoid collisions.
 */

const PREFIX = "sozo_test_";

export interface TestStateSnapshot {
  step: string;
  answers: Record<string, unknown>;
  currentIndex: number;
  respondentName: string;
  respondentEmail: string;
  savedAt: number;
}

export function saveTestState(testSlug: string, state: TestStateSnapshot): void {
  try {
    localStorage.setItem(PREFIX + testSlug, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function loadTestState(testSlug: string): TestStateSnapshot | null {
  try {
    const raw = localStorage.getItem(PREFIX + testSlug);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TestStateSnapshot;
    // Expire after 24 hours
    if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
      clearTestState(testSlug);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearTestState(testSlug: string): void {
  try {
    localStorage.removeItem(PREFIX + testSlug);
  } catch {
    // fail silently
  }
}
