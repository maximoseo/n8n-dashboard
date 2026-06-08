/**
 * Pure aggregation helpers for the Overview KPIs, Error Center clustering, and
 * alert-rule evaluation. Dependency-free so they unit-test under `node --test`
 * and run on both client and server.
 */

export interface KpiWorkflow {
  status: 'active' | 'paused' | 'error'
  runs: number
  successRate7d?: number | null
  healthScore?: number | null
  riskScore?: number | null
  healthBand?: string | null
  lastExecutionStatus?: string | null
  avgDurationMs?: number | null
  tags?: string[]
  category?: string | null
}

export interface OverviewKpis {
  total: number
  active: number
  paused: number
  error: number
  failing: number // last execution errored
  atRisk: number // health band Risky/Critical
  avgSuccessRate7d: number | null // 0..1
  totalRuns: number
  avgDurationMs: number | null
  withoutMetadata: number // no tags/category — proxy for missing owner/docs
  healthyPct: number // 0..1
}

export function computeOverviewKpis(workflows: KpiWorkflow[]): OverviewKpis {
  const total = workflows.length
  const active = workflows.filter((w) => w.status === 'active').length
  const paused = workflows.filter((w) => w.status === 'paused').length
  const error = workflows.filter((w) => w.status === 'error').length
  const failing = workflows.filter((w) => w.lastExecutionStatus === 'error').length
  const atRisk = workflows.filter((w) => w.healthBand === 'Risky' || w.healthBand === 'Critical').length
  const healthy = workflows.filter((w) => w.healthBand === 'Healthy' || w.healthBand === 'Excellent').length

  const rates = workflows.map((w) => w.successRate7d).filter((r): r is number => typeof r === 'number')
  const durations = workflows.map((w) => w.avgDurationMs).filter((d): d is number => typeof d === 'number' && d > 0)

  return {
    total,
    active,
    paused,
    error,
    failing,
    atRisk,
    avgSuccessRate7d: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null,
    totalRuns: workflows.reduce((a, w) => a + (w.runs || 0), 0),
    avgDurationMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
    withoutMetadata: workflows.filter((w) => (!w.tags || w.tags.length === 0) && !w.category).length,
    healthyPct: total ? healthy / total : 0,
  }
}

export interface ErrExec {
  n8nExecutionId: string
  workflowName: string
  errorFingerprint: string | null
  startedAt: string | null
}

export interface ErrorCluster {
  fingerprint: string
  title: string
  severity: 'critical' | 'high' | 'medium'
  occurrenceCount: number
  affectedWorkflows: string[]
  firstSeen: string | null
  lastSeen: string | null
}

/** Cluster failed executions by error fingerprint. */
export function clusterErrors(executions: ErrExec[]): ErrorCluster[] {
  const map = new Map<string, ErrorCluster>()
  for (const e of executions) {
    const fp = e.errorFingerprint || `nofp:${e.workflowName}`
    let c = map.get(fp)
    if (!c) {
      c = {
        fingerprint: fp,
        title: e.workflowName,
        severity: 'medium',
        occurrenceCount: 0,
        affectedWorkflows: [],
        firstSeen: e.startedAt,
        lastSeen: e.startedAt,
      }
      map.set(fp, c)
    }
    c.occurrenceCount++
    if (!c.affectedWorkflows.includes(e.workflowName)) c.affectedWorkflows.push(e.workflowName)
    if (e.startedAt) {
      if (!c.firstSeen || e.startedAt < c.firstSeen) c.firstSeen = e.startedAt
      if (!c.lastSeen || e.startedAt > c.lastSeen) c.lastSeen = e.startedAt
    }
  }
  for (const c of map.values()) {
    // Severity by blast radius + frequency.
    if (c.affectedWorkflows.length >= 3 || c.occurrenceCount >= 10) c.severity = 'critical'
    else if (c.occurrenceCount >= 4) c.severity = 'high'
    else c.severity = 'medium'
  }
  return [...map.values()].sort((a, b) => b.occurrenceCount - a.occurrenceCount)
}

export type AlertSeverity = 'critical' | 'warning'
export interface Alert {
  key: string
  severity: AlertSeverity
  title: string
  detail: string
}

export interface AlertThresholds {
  maxFailing?: number // alert if failing workflows exceed this
  minSuccessRate?: number // alert if avg 7d success below this (0..1)
  maxCriticalClusters?: number // alert if critical error clusters exceed this
}

/** Evaluate alert rules against KPIs + clusters. Pure — caller dispatches. */
export function evaluateAlerts(
  kpis: OverviewKpis,
  clusters: ErrorCluster[],
  thresholds: AlertThresholds = {}
): Alert[] {
  const t = { maxFailing: 0, minSuccessRate: 0.7, maxCriticalClusters: 0, ...thresholds }
  const alerts: Alert[] = []

  if (kpis.failing > t.maxFailing) {
    alerts.push({
      key: 'failing-workflows',
      severity: 'critical',
      title: `${kpis.failing} workflow(s) failing`,
      detail: `${kpis.failing} workflows have an errored last execution (threshold ${t.maxFailing}).`,
    })
  }
  if (kpis.avgSuccessRate7d != null && kpis.avgSuccessRate7d < t.minSuccessRate) {
    alerts.push({
      key: 'low-success-rate',
      severity: 'warning',
      title: `Avg 7d success ${Math.round(kpis.avgSuccessRate7d * 100)}%`,
      detail: `Below the ${Math.round(t.minSuccessRate * 100)}% target.`,
    })
  }
  const criticalClusters = clusters.filter((c) => c.severity === 'critical')
  if (criticalClusters.length > t.maxCriticalClusters) {
    alerts.push({
      key: 'critical-error-clusters',
      severity: 'critical',
      title: `${criticalClusters.length} critical error cluster(s)`,
      detail: criticalClusters.slice(0, 3).map((c) => c.title).join('; '),
    })
  }
  return alerts
}
