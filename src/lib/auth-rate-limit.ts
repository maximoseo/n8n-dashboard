import { NextRequest } from 'next/server'

const RATE_LIMIT_WINDOW_SECONDS = 60
const RATE_LIMIT_MAX_REQUESTS = 5
const RATE_LIMIT_TIMEOUT_MS = 1_500
const redisUrl = process.env.AUTH_RATE_LIMIT_REDIS_URL || process.env.RESET_RATE_LIMIT_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || ''
const redisToken = process.env.AUTH_RATE_LIMIT_REDIS_TOKEN || process.env.RESET_RATE_LIMIT_REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return request.headers.get('x-real-ip') || 'unknown'
}

async function redisCommand(path: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), RATE_LIMIT_TIMEOUT_MS)

  try {
    return await fetch(`${redisUrl}${path}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
      cache: 'no-store',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function checkAuthRateLimit(key: string) {
  if (!redisUrl || !redisToken) {
    console.warn('Auth rate limiting is disabled because Redis is not configured.')
    return true
  }

  try {
    const redisKey = `n8n-dashboard:auth:${key}`
    const encodedKey = encodeURIComponent(redisKey)
    const incrementResponse = await redisCommand(`/incr/${encodedKey}`)

    if (!incrementResponse.ok) {
      console.warn('Auth rate limit check failed; allowing request.')
      return true
    }

    const incrementData = await incrementResponse.json() as { result?: number }
    const count = Number(incrementData.result || 0)

    const expireResponse = await redisCommand(`/expire/${encodedKey}/${RATE_LIMIT_WINDOW_SECONDS}`)
    if (!expireResponse.ok) {
      console.warn('Auth rate limit TTL update failed; continuing with current counter.')
    }

    return count > 0 && count <= RATE_LIMIT_MAX_REQUESTS
  } catch {
    console.warn('Auth rate limit check timed out or failed; allowing request.')
    return true
  }
}
