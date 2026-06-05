// Simple caching layer for dashboard
// Uses in-memory cache with TTL (Time To Live)

interface CacheEntry<T> {
  value: T
  expiry: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number

  constructor(defaultTTLMinutes: number = 5) {
    this.defaultTTL = defaultTTLMinutes * 60 * 1000 // Convert to ms
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  // Get value from cache
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) return undefined
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return undefined
    }
    
    return entry.value as T
  }

  // Set value in cache
  set<T>(key: string, value: T, ttlMinutes?: number): void {
    const ttl = (ttlMinutes ?? this.defaultTTL / 60 / 1000) * 60 * 1000
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    })
  }

  // Delete value from cache
  delete(key: string): void {
    this.cache.delete(key)
  }

  // Check if key exists and not expired
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Get cache stats
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

// Export singleton instance
export const cache = new MemoryCache(5)

// Cache keys helper
export const cacheKeys = {
  workflows: 'workflows:list',
  workflow: (id: string) => `workflow:${id}`,
  executions: (workflowId: string) => `executions:${workflowId}`,
  sheetMapping: (workflowId: string) => `sheet:${workflowId}`,
  serpData: (keyword: string) => `serp:${keyword}`,
  backlinkData: (domain: string) => `backlinks:${domain}`,
  keywordVolume: (keyword: string) => `volume:${keyword}`,
  aiContent: (prompt: string) => `ai:${hashString(prompt)}`,
}

// Hash string for cache key
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

// Cached fetch wrapper
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMinutes?: number
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(key)
  if (cached !== undefined) {
    return cached
  }

  // Fetch fresh data
  const data = await fetchFn()
  
  // Store in cache
  cache.set(key, data, ttlMinutes)
  
  return data
}

// Invalidate cache pattern
export function invalidateCache(pattern: string): void {
  const keys = cache.stats().keys
  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// Cache decorator for functions
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlMinutes?: number
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyGenerator(...args)
    return cachedFetch(key, () => fn(...args), ttlMinutes) as ReturnType<T>
  }) as T
}
