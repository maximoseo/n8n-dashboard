import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeScores, healthBand, runtimeRisk, stalenessRisk, type ScoreInput } from '../scoring.ts'

const NOW = 1_700_000_000_000

function base(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    active: true,
    triggerCount: 1,
    totalExecutions: 100,
    successRate24h: 1,
    successRate7d: 1,
    lastExecutionStatus: 'success',
    lastExecutionAtMs: NOW - 3_600_000, // 1h ago
    avgDurationMs: 5_000,
    p95DurationMs: 10_000,
    hasTags: true,
    nowMs: NOW,
    ...overrides,
  }
}

test('scores are bounded 0..100', () => {
  for (const i of [base(), base({ successRate24h: 0, successRate7d: 0, active: false, hasTags: false, lastExecutionStatus: 'error', lastExecutionAtMs: null })]) {
    const s = computeScores(i)
    assert.ok(s.health >= 0 && s.health <= 100, `health ${s.health}`)
    assert.ok(s.risk >= 0 && s.risk <= 100, `risk ${s.risk}`)
  }
})

test('a perfectly healthy workflow scores high health, low risk', () => {
  const s = computeScores(base())
  assert.ok(s.health >= 90, `expected >=90 got ${s.health}`)
  assert.equal(s.band, 'Excellent')
  assert.ok(s.risk <= 40, `expected low risk got ${s.risk}`)
})

test('more recent failures lower health and raise risk (monotonic)', () => {
  const good = computeScores(base({ successRate24h: 1, successRate7d: 1, lastExecutionStatus: 'success' }))
  const bad = computeScores(base({ successRate24h: 0.1, successRate7d: 0.2, lastExecutionStatus: 'error' }))
  assert.ok(bad.health < good.health)
  assert.ok(bad.risk > good.risk)
})

test('staleness and runtime helpers behave', () => {
  assert.equal(stalenessRisk(null, NOW), 1)
  assert.equal(stalenessRisk(NOW - 3_600_000, NOW), 0)
  assert.ok(runtimeRisk(600_000) > runtimeRisk(5_000))
})

test('inactive workflows are banded Paused, not Critical', () => {
  const s = computeScores(base({ active: false, triggerCount: 0, totalExecutions: 0, successRate24h: null, successRate7d: null, lastExecutionStatus: null, lastExecutionAtMs: null }))
  assert.equal(s.band, 'Paused')
})

test('healthBand thresholds', () => {
  assert.equal(healthBand(95), 'Excellent')
  assert.equal(healthBand(80), 'Healthy')
  assert.equal(healthBand(65), 'Needs improvement')
  assert.equal(healthBand(50), 'Risky')
  assert.equal(healthBand(10), 'Critical')
})

test('missing data does not throw and yields a neutral-ish score', () => {
  const s = computeScores(base({ successRate24h: null, successRate7d: null, totalExecutions: 0, lastExecutionStatus: 'unknown', avgDurationMs: null, p95DurationMs: null }))
  assert.ok(s.health > 0 && s.health < 100)
  assert.ok(s.risk > 0 && s.risk < 100)
})
