import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { serverEnv } from '@/lib/env'
import { getPack, isValidDomain, packServices } from '@/lib/seo-packs'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PACK_WEBHOOK = process.env.N8N_SITE_PACK_WEBHOOK_URL || ''

/**
 * Start a SEO automation pack run for a site. Records a run row (shared
 * correlation id). If N8N_SITE_PACK_WEBHOOK_URL is configured, the orchestration
 * is delegated to n8n; otherwise the run is recorded as queued for later wiring.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const userId = auth.user?.id ?? auth.user?.sub ?? null

  const body = await request.json().catch(() => ({}))
  const packId = String(body?.packId ?? '')
  const domain = String(body?.domain ?? '').trim()
  const pack = getPack(packId)
  if (!pack) return NextResponse.json({ error: 'unknown packId' }, { status: 400 })
  if (!isValidDomain(domain)) return NextResponse.json({ error: 'invalid domain' }, { status: 400 })

  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'pack run store not configured (SUPABASE_SERVICE_ROLE_KEY)' }, { status: 503 })
  }
  const db = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const triggeredVia = PACK_WEBHOOK ? 'webhook' : 'recorded'
  const { data: run, error } = await db
    .from('n8nmon_pack_runs')
    .insert({ pack_id: pack.id, domain, status: PACK_WEBHOOK ? 'running' : 'queued', triggered_via: triggeredVia, created_by: userId })
    .select('id, correlation_id')
    .single()

  if (error || !run) return NextResponse.json({ error: error?.message ?? 'failed to create run' }, { status: 500 })

  let webhook: 'sent' | 'skipped' | 'failed' = 'skipped'
  if (PACK_WEBHOOK) {
    try {
      const res = await fetch(PACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          domain,
          correlationId: run.correlation_id,
          children: pack.children.map((c) => c.key),
          services: packServices(pack),
        }),
      })
      webhook = res.ok ? 'sent' : 'failed'
      if (!res.ok) await db.from('n8nmon_pack_runs').update({ status: 'failed' }).eq('id', run.id)
    } catch {
      webhook = 'failed'
      await db.from('n8nmon_pack_runs').update({ status: 'failed' }).eq('id', run.id)
    }
  }

  await recordAudit({ userId, action: 'seo.pack.run', resourceType: 'pack_run', resourceId: run.id, details: { packId: pack.id, domain, triggeredVia, webhook } })
  return NextResponse.json({ ok: true, runId: run.id, correlationId: run.correlation_id, triggeredVia, webhook })
}
