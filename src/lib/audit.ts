/**
 * Append-only audit logging for sensitive dashboard operations.
 * Writes to the existing `dashboard_audit_log` table via the Supabase
 * service role (server-side only). Details are redacted before storage.
 */
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '@/lib/env'
import { redactAll } from '@/lib/redaction'

export type AuditEvent = {
  userId?: string | null
  action: string
  resourceType?: string
  resourceId?: string
  details?: Record<string, unknown>
}

function serviceClient() {
  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Best-effort audit write. Never throws into the caller — auditing must not
 * break the primary operation, but failures are logged (redacted).
 */
export async function recordAudit(event: AuditEvent): Promise<void> {
  const client = serviceClient()
  if (!client) {
    console.warn('[audit] service client unavailable; skipping audit write for', event.action)
    return
  }
  try {
    await client.from('dashboard_audit_log').insert({
      user_id: event.userId ?? null,
      action: event.action,
      resource_type: event.resourceType ?? null,
      resource_id: event.resourceId ?? null,
      details: event.details ? (redactAll(event.details) as Record<string, unknown>) : null,
    })
  } catch (err) {
    console.warn('[audit] failed to write event', event.action, err instanceof Error ? err.message : err)
  }
}
