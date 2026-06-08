import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { serverEnv } from '@/lib/env'
import { runN8nSync } from '@/lib/n8n/sync'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Trigger a read-only n8n -> Supabase sync.
 * Auth: an authenticated dashboard user (UI "Sync now") OR a machine caller
 * presenting the shared `x-sync-secret` (cron/CI). RBAC roles are deferred.
 */
export async function POST(request: NextRequest) {
  const machineSecret = request.headers.get('x-sync-secret')
  const isMachine =
    !!serverEnv.SYNC_SECRET && machineSecret === serverEnv.SYNC_SECRET

  let userId: string | null = null
  if (!isMachine) {
    const auth = await requireAuthenticatedUser(request)
    if (auth.response) return auth.response
    userId = auth.user?.id ?? auth.user?.sub ?? null
  }

  try {
    const summary = await runN8nSync()
    await recordAudit({
      userId: isMachine ? 'machine:sync' : userId,
      action: 'n8n.sync',
      resourceType: 'n8n_instance',
      resourceId: summary.instance.host,
      details: {
        apiStatus: summary.apiStatus,
        workflows: summary.workflows,
        executions: summary.executions,
        failedExecutions: summary.failedExecutions,
        durationMs: summary.durationMs,
      },
    })
    return NextResponse.json(summary, { status: summary.ok ? 200 : 502 })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'sync failed' },
      { status: 500 }
    )
  }
}
