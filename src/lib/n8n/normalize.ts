/**
 * Normalize raw n8n REST responses into dashboard shapes and derive
 * per-workflow metrics from a recent execution window. Dependency-free.
 */
import type {
  ExecutionStatus,
  NormalizedExecution,
  NormalizedWorkflow,
  RawExecution,
  RawWorkflow,
  WorkflowMetrics,
} from './types'

const DAY = 86_400_000

export function normalizeTags(tags: RawWorkflow['tags']): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((t) => (typeof t === 'string' ? t : typeof t?.name === 'string' ? t.name : ''))
    .filter(Boolean)
}

export function normalizeWorkflow(raw: RawWorkflow): NormalizedWorkflow {
  const tags = normalizeTags(raw.tags)
  return {
    n8nWorkflowId: String(raw.id),
    name: raw.name ?? '(unnamed)',
    active: Boolean(raw.active),
    tags,
    triggerType: inferTriggerType(raw),
    triggerCount: typeof raw.triggerCount === 'number' ? raw.triggerCount : 0,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  }
}

function inferTriggerType(raw: RawWorkflow): string {
  const types = (raw.nodes ?? []).map((n) => n.type ?? '')
  if (types.some((t) => /webhook/i.test(t))) return 'webhook'
  if (types.some((t) => /cron|schedule/i.test(t))) return 'schedule'
  if (types.some((t) => /manualTrigger/i.test(t))) return 'manual'
  return raw.triggerCount && raw.triggerCount > 0 ? 'trigger' : 'unknown'
}

export function deriveStatus(raw: RawExecution): ExecutionStatus {
  const s = (raw.status ?? '').toLowerCase()
  if (s === 'success' || s === 'error' || s === 'running' || s === 'waiting' || s === 'canceled') {
    return s as ExecutionStatus
  }
  // Older n8n: no status field; infer from finished/stoppedAt.
  if (raw.finished === false && !raw.stoppedAt) return 'running'
  if (raw.finished === true) return 'success'
  return 'unknown'
}

/** Tiny stable hash (djb2) — avoids a crypto import for error fingerprints. */
export function djb2(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return (h >>> 0).toString(16)
}

export function normalizeExecution(
  raw: RawExecution,
  workflowName: string
): NormalizedExecution {
  const status = deriveStatus(raw)
  const startedAt = raw.startedAt ?? null
  const finishedAt = raw.stoppedAt ?? null
  let durationMs: number | null = null
  if (startedAt && finishedAt) {
    const d = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
    durationMs = Number.isFinite(d) && d >= 0 ? d : null
  }
  const fingerprint =
    status === 'error' ? djb2(`${workflowName}:${raw.mode ?? 'n/a'}:error`) : null
  return {
    n8nExecutionId: String(raw.id),
    n8nWorkflowId: String(raw.workflowId ?? ''),
    status,
    mode: raw.mode ?? null,
    startedAt,
    finishedAt,
    durationMs,
    errorFingerprint: fingerprint,
  }
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

export function computeMetrics(
  executions: NormalizedExecution[],
  nowMs: number
): WorkflowMetrics {
  const settled = executions.filter((e) => e.status === 'success' || e.status === 'error')
  const within = (e: NormalizedExecution, ms: number) => {
    const t = e.startedAt ? new Date(e.startedAt).getTime() : NaN
    return Number.isFinite(t) && nowMs - t <= ms
  }
  const rate = (subset: NormalizedExecution[]) => {
    if (subset.length === 0) return null
    const ok = subset.filter((e) => e.status === 'success').length
    return ok / subset.length
  }

  const durations = settled
    .map((e) => e.durationMs)
    .filter((d): d is number => typeof d === 'number')

  const last = executions[0] ?? null

  return {
    totalExecutions: executions.length,
    successRate24h: rate(settled.filter((e) => within(e, DAY))),
    successRate7d: rate(settled.filter((e) => within(e, 7 * DAY))),
    avgDurationMs:
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null,
    p95DurationMs: percentile(durations, 95),
    lastExecutionId: last ? last.n8nExecutionId : null,
    lastExecutionStatus: last ? last.status : null,
    lastExecutionAtMs:
      last && last.startedAt ? new Date(last.startedAt).getTime() : null,
  }
}
