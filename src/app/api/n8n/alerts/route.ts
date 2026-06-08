import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { serverEnv } from '@/lib/env'
import { runAlertCheck } from '@/lib/alerts'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * Evaluate alert rules against synced data and dispatch notifications.
 * Auth: authenticated dashboard user OR `x-sync-secret` (cron/CI).
 */
export async function POST(request: NextRequest) {
  const isMachine = !!serverEnv.SYNC_SECRET && request.headers.get('x-sync-secret') === serverEnv.SYNC_SECRET
  let userId: string | null = null
  if (!isMachine) {
    const auth = await requireAuthenticatedUser(request)
    if (auth.response) return auth.response
    userId = auth.user?.id ?? auth.user?.sub ?? null
  }

  const result = await runAlertCheck()
  if (result.alerts.length > 0) {
    await recordAudit({
      userId: isMachine ? 'machine:alerts' : userId,
      action: 'n8n.alerts.check',
      resourceType: 'alerts',
      details: { count: result.alerts.length, dispatched: result.dispatched },
    })
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
