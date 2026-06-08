import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { serverEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * Returns the synced workflow portfolio (cached metrics + health/risk) plus a
 * sync-status summary and recent failed executions. Reads Supabase via the
 * service role after verifying the requesting dashboard user. Returns
 * source:'empty' when no sync has run yet so the UI can fall back to the live
 * /api/n8n/workflows route.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response

  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ source: 'unconfigured', workflows: [] }, { status: 200 })
  }

  const db = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [{ data: instances }, { data: workflows }, { data: failed }] = await Promise.all([
    db.from('n8nmon_instances').select('id, name, base_url, api_status, last_sync_at'),
    db
      .from('n8nmon_workflows')
      .select(
        'instance_id, n8n_workflow_id, name, active, category, tags, total_executions, success_rate_24h, success_rate_7d, avg_duration_ms, last_execution_status, last_execution_at, health_score, risk_score, health_band'
      )
      .order('risk_score', { ascending: false, nullsFirst: false }),
    db
      .from('n8nmon_executions')
      .select('instance_id, n8n_workflow_id, n8n_execution_id, status, started_at, duration_ms')
      .eq('status', 'error')
      .order('started_at', { ascending: false, nullsFirst: false })
      .limit(25),
  ])

  if (!workflows || workflows.length === 0) {
    return NextResponse.json({ source: 'empty', workflows: [], syncStatus: syncStatusOf(instances) })
  }

  const hostById = new Map<string, string>()
  const nameByWorkflowKey = new Map<string, string>()
  for (const i of instances ?? []) hostById.set(i.id, new URL(i.base_url).host)

  const mapped = workflows.map((w: any) => {
    const host = hostById.get(w.instance_id) ?? 'websiseo.app.n8n.cloud'
    nameByWorkflowKey.set(`${w.instance_id}:${w.n8n_workflow_id}`, w.name)
    return {
      id: w.n8n_workflow_id,
      n8nWorkflowId: w.n8n_workflow_id,
      name: w.name,
      description: Array.isArray(w.tags) && w.tags.length ? w.tags.join(', ') : 'No description',
      status: displayStatus(w.active, w.last_execution_status),
      category: w.category ?? 'General',
      tags: Array.isArray(w.tags) ? w.tags : [],
      runs: w.total_executions ?? 0,
      lastRun: formatTimeAgo(w.last_execution_at),
      successRate7d: w.success_rate_7d,
      avgDurationMs: w.avg_duration_ms,
      lastExecutionStatus: w.last_execution_status,
      healthScore: w.health_score,
      riskScore: w.risk_score,
      healthBand: w.health_band,
      openInN8nUrl: `https://${host}/workflow/${w.n8n_workflow_id}`,
    }
  })

  const failedExecutions = (failed ?? []).map((e: any) => {
    const host = hostById.get(e.instance_id) ?? 'websiseo.app.n8n.cloud'
    return {
      id: e.n8n_execution_id,
      workflowName: nameByWorkflowKey.get(`${e.instance_id}:${e.n8n_workflow_id}`) ?? e.n8n_workflow_id,
      status: e.status,
      startedAt: e.started_at,
      durationMs: e.duration_ms,
      openInN8nUrl: `https://${host}/workflow/${e.n8n_workflow_id}/executions/${e.n8n_execution_id}`,
    }
  })

  return NextResponse.json({
    source: 'supabase',
    syncStatus: syncStatusOf(instances),
    counts: {
      total: mapped.length,
      active: mapped.filter((m) => m.status === 'active').length,
      paused: mapped.filter((m) => m.status === 'paused').length,
      error: mapped.filter((m) => m.status === 'error').length,
    },
    workflows: mapped,
    failedExecutions,
  })
}

function displayStatus(active: boolean, lastStatus: string | null): 'active' | 'paused' | 'error' {
  if (!active) return 'paused'
  if (lastStatus === 'error') return 'error'
  return 'active'
}

function syncStatusOf(instances: any[] | null) {
  if (!instances || instances.length === 0) return null
  const primary = instances.reduce((a, b) =>
    new Date(b.last_sync_at ?? 0) > new Date(a.last_sync_at ?? 0) ? b : a
  )
  return {
    host: new URL(primary.base_url).host,
    apiStatus: primary.api_status ?? 'unknown',
    lastSyncAt: primary.last_sync_at ?? null,
  }
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const date = new Date(iso).getTime()
  if (!Number.isFinite(date)) return 'Never'
  const diff = Date.now() - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  return `${days} day${days === 1 ? '' : 's'} ago`
}
