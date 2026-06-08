/**
 * Workflow health + risk scoring (v1).
 *
 * Dependency-free and pure so it runs under `node --test` and is trivially
 * unit-testable. Risk weights follow the super-plan §4.3. Where the read-only
 * REST sync cannot yet observe a signal (error-handling nodes, credentials,
 * cost), v1 uses a documented neutral proxy rather than guessing — these are
 * the factors to refine when deeper inspection lands.
 */

export type LastExecStatus =
  | 'success'
  | 'error'
  | 'running'
  | 'waiting'
  | 'canceled'
  | 'unknown'
  | null

export interface ScoreInput {
  active: boolean
  triggerCount: number
  totalExecutions: number
  successRate24h: number | null // 0..1
  successRate7d: number | null // 0..1
  lastExecutionStatus: LastExecStatus
  lastExecutionAtMs: number | null
  avgDurationMs: number | null
  p95DurationMs: number | null
  hasTags: boolean
  nowMs: number
}

export interface Scores {
  health: number // 0..100 (higher is better)
  risk: number // 0..100 (higher is riskier)
  band: HealthBand
}

export type HealthBand = 'Excellent' | 'Healthy' | 'Needs improvement' | 'Risky' | 'Critical' | 'Paused'

const DAY = 86_400_000

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function round(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)))
}

/** Risk contribution from p95/avg runtime (timeout exposure). 0..1 */
export function runtimeRisk(durationMs: number | null): number {
  if (durationMs == null) return 0.2
  if (durationMs < 30_000) return 0.1
  if (durationMs < 120_000) return 0.3
  if (durationMs < 300_000) return 0.6
  return 0.9
}

/** Risk contribution from staleness of the last run. 0..1 */
export function stalenessRisk(lastExecutionAtMs: number | null, nowMs: number): number {
  if (lastExecutionAtMs == null) return 1
  const age = nowMs - lastExecutionAtMs
  if (age < DAY) return 0
  if (age < 7 * DAY) return 0.2
  if (age < 30 * DAY) return 0.5
  return 1
}

export function healthBand(health: number): HealthBand {
  if (health >= 90) return 'Excellent'
  if (health >= 75) return 'Healthy'
  if (health >= 60) return 'Needs improvement'
  if (health >= 40) return 'Risky'
  return 'Critical'
}

export function computeScores(input: ScoreInput): Scores {
  const reliability =
    input.successRate7d ?? input.successRate24h ?? (input.totalExecutions === 0 ? 0.5 : 1)

  // --- Health (higher = better) ---
  const freshness = 1 - stalenessRisk(input.lastExecutionAtMs, input.nowMs)
  const activeFactor = input.active ? (input.triggerCount > 0 ? 1 : 0.6) : 0.2
  const lastOk =
    input.lastExecutionStatus === 'success'
      ? 1
      : input.lastExecutionStatus === 'error'
        ? 0
        : 0.5

  const health = round(
    100 *
      (0.55 * clamp01(reliability) +
        0.2 * clamp01(freshness) +
        0.1 * activeFactor +
        0.15 * lastOk)
  )

  // --- Risk (higher = riskier), weights per super-plan §4.3 ---
  const recentFailure = 1 - clamp01(input.successRate24h ?? input.successRate7d ?? 0.8)
  const criticality = input.active && input.triggerCount > 0 ? 0.8 : 0.4
  const missingErrorHandling = 0.5 // v1 proxy: not observable via REST list
  const missingOwnerDocs = input.hasTags ? 0.3 : 1
  const credentialRisk = 0.3 // v1 proxy
  const runtime = runtimeRisk(input.p95DurationMs ?? input.avgDurationMs)
  const costRisk = 0.2 // v1 proxy
  const staleness = stalenessRisk(input.lastExecutionAtMs, input.nowMs)

  const risk = round(
    100 *
      (0.25 * recentFailure +
        0.15 * criticality +
        0.15 * missingErrorHandling +
        0.1 * missingOwnerDocs +
        0.1 * credentialRisk +
        0.1 * runtime +
        0.1 * costRisk +
        0.05 * staleness)
  )

  // Intentionally-paused/inactive workflows are reported as 'Paused' (neutral),
  // not Critical — they're not failing, just not running. Keeps the "at risk"
  // KPI focused on active workflows that actually need attention.
  return { health, risk, band: input.active ? healthBand(health) : 'Paused' }
}
