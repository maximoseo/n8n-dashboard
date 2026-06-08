/**
 * Server-side environment access + validation.
 *
 * Centralizes env reads so routes/jobs stop scattering `process.env.X || ''`.
 * Dependency-free (no zod) to avoid adding a runtime dependency.
 *
 * Usage:
 *   import { serverEnv, requireEnv } from '@/lib/env'
 *   const key = requireEnv('N8N_API_KEY')   // throws if missing
 *   const base = serverEnv.N8N_BASE_URL      // has a safe default
 */

function read(name: string, fallback = ''): string {
  const v = process.env[name]
  return typeof v === 'string' && v.length > 0 ? v : fallback
}

/** Throw if a required secret is absent. Use inside server handlers/jobs. */
export function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return v
}

/** True when every named var is present and non-empty. */
export function hasEnv(...names: string[]): boolean {
  return names.every((n) => {
    const v = process.env[n]
    return typeof v === 'string' && v.length > 0
  })
}

export const serverEnv = {
  // n8n
  N8N_API_KEY: read('N8N_API_KEY'),
  N8N_BASE_URL: read('N8N_BASE_URL', 'https://websiseo.app.n8n.cloud'),
  SYNC_SECRET: read('SYNC_SECRET'),

  // Supabase (server)
  SUPABASE_URL: read('SUPABASE_URL', read('NEXT_PUBLIC_SUPABASE_URL')),
  SUPABASE_ANON_KEY: read('SUPABASE_ANON_KEY', read('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
  SUPABASE_SERVICE_ROLE_KEY: read('SUPABASE_SERVICE_ROLE_KEY'),

  APP_BASE_URL: read('APP_BASE_URL', 'http://localhost:3000'),
} as const

/** Returns a list of human-readable warnings for optional-but-recommended vars. */
export function envHealth(): { ok: boolean; warnings: string[] } {
  const warnings: string[] = []
  if (!serverEnv.N8N_API_KEY) warnings.push('N8N_API_KEY not set — n8n sync and live views are disabled.')
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY)
    warnings.push('SUPABASE_SERVICE_ROLE_KEY not set — n8n sync cannot persist cached metrics.')
  return { ok: warnings.length === 0, warnings }
}
