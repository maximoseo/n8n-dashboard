import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { getN8nClient } from '@/lib/n8n/factory'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * HIGH-RISK production mutation: activate / deactivate a workflow.
 * Gated: requires an authenticated user, `confirm: true`, and a non-empty
 * `reason`. Every attempt (allowed or rejected) is audited. Never auto-fired —
 * the UI must collect explicit confirmation before calling this.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const { id } = await params
  const userId = auth.user?.id ?? auth.user?.sub ?? null

  const body = await request.json().catch(() => ({}))
  const action = body?.action
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  const confirmed = body?.confirm === true

  if (action !== 'activate' && action !== 'deactivate') {
    return NextResponse.json({ error: 'action must be "activate" or "deactivate"' }, { status: 400 })
  }
  if (!confirmed || reason.length < 3) {
    await recordAudit({
      userId,
      action: `n8n.workflow.${action}.rejected`,
      resourceType: 'workflow',
      resourceId: id,
      details: { reason, confirmed },
    })
    return NextResponse.json({ error: 'Explicit confirm:true and a reason (>=3 chars) are required.' }, { status: 412 })
  }

  const client = getN8nClient()
  if (!client) return NextResponse.json({ error: 'n8n API key not configured' }, { status: 503 })

  try {
    const result = await client.setActive(id, action === 'activate')
    await recordAudit({
      userId,
      action: `n8n.workflow.${action}`,
      resourceType: 'workflow',
      resourceId: id,
      details: { reason, active: result?.active },
    })
    return NextResponse.json({ ok: true, id, active: result?.active })
  } catch (error) {
    await recordAudit({
      userId,
      action: `n8n.workflow.${action}.failed`,
      resourceType: 'workflow',
      resourceId: id,
      details: { reason, error: error instanceof Error ? error.message : 'unknown' },
    })
    return NextResponse.json({ error: error instanceof Error ? error.message : 'mutation failed' }, { status: 502 })
  }
}
