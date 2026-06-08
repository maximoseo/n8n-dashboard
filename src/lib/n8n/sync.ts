/**
 * Read-only n8n -> Supabase sync orchestrator.
 *
 * Lists workflows from a single allowed instance, pulls a recent execution
 * window per workflow, derives metrics + health/risk scores, and upserts the
 * normalized result into Supabase via the service role. This is the single
 * source of truth for both the in-UI "Sync now" action and the cron script.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { serverEnv } from '@/lib/env'
import { computeScores } from '@/lib/scoring'
import { N8nClient, mapWithConcurrency } from './client'
import { computeMetrics, normalizeExecution, normalizeWorkflow } from './normalize'
import type { NormalizedExecution } from './types'

const EXECUTION_WINDOW = 20 // recent executions pulled per workflow

export interface SyncSummary {
  ok: boolean
  instance: { name: string; host: string; environment: string }
  apiStatus: 'reachable' | 'unreachable' | 'unconfigured'
  workflows: number
  executions: number
  failedExecutions: number
  durationMs: number
  error?: string
}

function serviceClient(): SupabaseClient | null {
  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function runN8nSync(nowMs: number = Date.now()): Promise<SyncSummary> {
  const startedAt = Date.now()
  const baseUrl = serverEnv.N8N_BASE_URL
  const host = new URL(baseUrl).host
  const instanceMeta = { name: host.split('.')[0], host, environment: 'production' }

  const empty = (over: Partial<SyncSummary>): SyncSummary => ({
    ok: false,
    instance: instanceMeta,
    apiStatus: 'unconfigured',
    workflows: 0,
    executions: 0,
    failedExecutions: 0,
    durationMs: Date.now() - startedAt,
    ...over,
  })

  if (!serverEnv.N8N_API_KEY) return empty({ error: 'N8N_API_KEY not configured' })
  const db = serviceClient()
  if (!db) return empty({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' })

  const client = new N8nClient({ baseUrl, apiKey: serverEnv.N8N_API_KEY })

  // Upsert the instance row first so we always record an attempt.
  const reachable = await client.ping()
  const apiStatus: SyncSummary['apiStatus'] = reachable ? 'reachable' : 'unreachable'
  const { data: instRow, error: instErr } = await db
    .from('n8nmon_instances')
    .upsert(
      {
        name: instanceMeta.name,
        base_url: baseUrl,
        environment: instanceMeta.environment,
        instance_type: 'n8n_cloud',
        api_status: apiStatus,
        read_only: true,
        last_sync_at: new Date(nowMs).toISOString(),
      },
      { onConflict: 'base_url' }
    )
    .select('id')
    .single()

  if (instErr || !instRow) {
    return empty({ apiStatus, error: `instance upsert failed: ${instErr?.message ?? 'no row'}` })
  }
  const instanceId = instRow.id as string

  if (!reachable) {
    return { ...empty({ apiStatus, error: 'n8n API unreachable' }), durationMs: Date.now() - startedAt }
  }

  const rawWorkflows = await client.listWorkflows(250)
  let executionTotal = 0
  let failedTotal = 0

  await mapWithConcurrency(rawWorkflows, 8, async (raw) => {
    const wf = normalizeWorkflow(raw)
    const rawExecs = await client.listExecutions(wf.n8nWorkflowId, EXECUTION_WINDOW)
    const execs: NormalizedExecution[] = rawExecs.map((e) => normalizeExecution(e, wf.name))
    const metrics = computeMetrics(execs, nowMs)
    const scores = computeScores({
      active: wf.active,
      triggerCount: wf.triggerCount,
      totalExecutions: metrics.totalExecutions,
      successRate24h: metrics.successRate24h,
      successRate7d: metrics.successRate7d,
      lastExecutionStatus: metrics.lastExecutionStatus,
      lastExecutionAtMs: metrics.lastExecutionAtMs,
      avgDurationMs: metrics.avgDurationMs,
      p95DurationMs: metrics.p95DurationMs,
      hasTags: wf.tags.length > 0,
      nowMs,
    })

    const { data: wfRow } = await db
      .from('n8nmon_workflows')
      .upsert(
        {
          instance_id: instanceId,
          n8n_workflow_id: wf.n8nWorkflowId,
          name: wf.name,
          active: wf.active,
          category: wf.tags[0] ?? null,
          trigger_type: wf.triggerType,
          trigger_count: wf.triggerCount,
          tags: wf.tags,
          total_executions: metrics.totalExecutions,
          success_rate_24h: metrics.successRate24h,
          success_rate_7d: metrics.successRate7d,
          avg_duration_ms: metrics.avgDurationMs,
          p95_duration_ms: metrics.p95DurationMs,
          last_execution_id: metrics.lastExecutionId,
          last_execution_status: metrics.lastExecutionStatus,
          last_execution_at: metrics.lastExecutionAtMs
            ? new Date(metrics.lastExecutionAtMs).toISOString()
            : null,
          health_score: scores.health,
          risk_score: scores.risk,
          health_band: scores.band,
          raw_metadata: { createdAt: wf.createdAt, updatedAt: wf.updatedAt },
        },
        { onConflict: 'instance_id,n8n_workflow_id' }
      )
      .select('id')
      .single()

    const workflowUuid = wfRow?.id as string | undefined

    if (execs.length > 0) {
      const rows = execs.map((e) => ({
        instance_id: instanceId,
        workflow_uuid: workflowUuid ?? null,
        n8n_workflow_id: wf.n8nWorkflowId,
        n8n_execution_id: e.n8nExecutionId,
        status: e.status,
        mode: e.mode,
        started_at: e.startedAt,
        finished_at: e.finishedAt,
        duration_ms: e.durationMs,
        error_fingerprint: e.errorFingerprint,
      }))
      executionTotal += rows.length
      failedTotal += execs.filter((e) => e.status === 'error').length
      await db.from('n8nmon_executions').upsert(rows, { onConflict: 'instance_id,n8n_execution_id' })
    }
  })

  return {
    ok: true,
    instance: instanceMeta,
    apiStatus,
    workflows: rawWorkflows.length,
    executions: executionTotal,
    failedExecutions: failedTotal,
    durationMs: Date.now() - startedAt,
  }
}
