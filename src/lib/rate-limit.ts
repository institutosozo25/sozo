/**
 * Client-side rate limiting (throttle) to prevent spam on sensitive endpoints.
 * Uses in-memory timestamps per action key.
 */

const timestamps = new Map<string, number[]>();

/**
 * Check if an action is allowed under rate limit.
 * @param key Unique key for the action (e.g. "forgot-password", "waitlist:slug")
 * @param maxAttempts Max attempts allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns true if allowed, false if rate-limited
 */
export function isRateLimited(key: string, maxAttempts = 3, windowMs = 60_000): boolean {
  const now = Date.now();
  const attempts = timestamps.get(key) || [];
  
  // Remove expired attempts
  const valid = attempts.filter((t) => now - t < windowMs);
  
  if (valid.length >= maxAttempts) {
    timestamps.set(key, valid);
    return true; // rate-limited
  }
  
  valid.push(now);
  timestamps.set(key, valid);
  return false;
}
