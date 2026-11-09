/**
 * Simple in-memory rate limiter for auth endpoints
 * In production, use Redis for distributed rate limiting
 */

interface RateLimitEntry {
  attempts: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (e.g., IP address, email)
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request should be allowed, false if rate limited
 */
export const checkRateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry) {
    // First request from this key
    rateLimitStore.set(key, {
      attempts: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (now > entry.resetTime) {
    // Window has expired, reset counter
    rateLimitStore.set(key, {
      attempts: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  // Still in rate limit window
  if (entry.attempts < maxAttempts) {
    entry.attempts += 1
    return true
  }

  // Rate limit exceeded
  return false
}

/**
 * Get remaining attempts for a key
 */
export const getRemainingAttempts = (key: string, maxAttempts: number = 5): number => {
  const entry = rateLimitStore.get(key)
  if (!entry || Date.now() > entry.resetTime) {
    return maxAttempts
  }
  return Math.max(0, maxAttempts - entry.attempts)
}

/**
 * Get reset time for a key (in milliseconds)
 */
export const getResetTime = (key: string): number => {
  const entry = rateLimitStore.get(key)
  if (!entry) {
    return 0
  }
  return Math.max(0, entry.resetTime - Date.now())
}
