import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeOverviewKpis, clusterErrors, evaluateAlerts, type KpiWorkflow, type ErrExec } from '../aggregate.ts'

const wfs: KpiWorkflow[] = [
  { status: 'active', runs: 100, successRate7d: 1, healthBand: 'Excellent', lastExecutionStatus: 'success', avgDurationMs: 5000, tags: ['seo'] },
  { status: 'active', runs: 10, successRate7d: 0.2, healthBand: 'Critical', lastExecutionStatus: 'error', avgDurationMs: 9000, tags: [] },
  { status: 'paused', runs: 0, successRate7d: null, healthBand: 'Risky', lastExecutionStatus: null, tags: [], category: null },
]

test('computeOverviewKpis aggregates correctly', () => {
  const k = computeOverviewKpis(wfs)
  assert.equal(k.total, 3)
  assert.equal(k.active, 2)
  assert.equal(k.paused, 1)
  assert.equal(k.failing, 1)
  assert.equal(k.atRisk, 2) // Critical + Risky
  assert.equal(k.totalRuns, 110)
  assert.equal(k.withoutMetadata, 2) // the 2nd (empty tags) and 3rd (no tags+category)
  assert.ok(Math.abs((k.avgSuccessRate7d ?? 0) - 0.6) < 1e-9) // mean of 1 and 0.2
})

test('empty input does not throw', () => {
  const k = computeOverviewKpis([])
  assert.equal(k.total, 0)
  assert.equal(k.avgSuccessRate7d, null)
  assert.equal(k.healthyPct, 0)
})

const execs: ErrExec[] = [
  { n8nExecutionId: 'e1', workflowName: 'A', errorFingerprint: 'fp1', startedAt: '2026-06-01T00:00:00Z' },
  { n8nExecutionId: 'e2', workflowName: 'A', errorFingerprint: 'fp1', startedAt: '2026-06-02T00:00:00Z' },
  { n8nExecutionId: 'e3', workflowName: 'B', errorFingerprint: 'fp1', startedAt: '2026-06-03T00:00:00Z' },
  { n8nExecutionId: 'e4', workflowName: 'C', errorFingerprint: 'fp1', startedAt: '2026-06-04T00:00:00Z' },
  { n8nExecutionId: 'e5', workflowName: 'D', errorFingerprint: 'fp2', startedAt: '2026-06-04T00:00:00Z' },
]

test('clusterErrors groups by fingerprint and scores severity', () => {
  const clusters = clusterErrors(execs)
  assert.equal(clusters.length, 2)
  const fp1 = clusters.find((c) => c.fingerprint === 'fp1')!
  assert.equal(fp1.occurrenceCount, 4)
  assert.equal(fp1.affectedWorkflows.length, 3) // A, B, C
  assert.equal(fp1.severity, 'critical') // >=3 workflows
  assert.equal(fp1.firstSeen, '2026-06-01T00:00:00Z')
  assert.equal(fp1.lastSeen, '2026-06-04T00:00:00Z')
})

test('evaluateAlerts fires on failing workflows and critical clusters', () => {
  const k = computeOverviewKpis(wfs)
  const clusters = clusterErrors(execs)
  const alerts = evaluateAlerts(k, clusters)
  assert.ok(alerts.some((a) => a.key === 'failing-workflows' && a.severity === 'critical'))
  assert.ok(alerts.some((a) => a.key === 'low-success-rate')) // 0.6 < 0.7
  assert.ok(alerts.some((a) => a.key === 'critical-error-clusters'))
})

test('evaluateAlerts quiet when healthy', () => {
  const healthy = computeOverviewKpis([{ status: 'active', runs: 5, successRate7d: 1, healthBand: 'Excellent', lastExecutionStatus: 'success', tags: ['x'] }])
  assert.equal(evaluateAlerts(healthy, []).length, 0)
})
