/**
 * Business value + ROI estimation (pure, dependency-free).
 *
 * These are transparent ESTIMATES derived from execution volume, success rate,
 * and a category heuristic — not measured outcomes. They give a relative
 * ranking (most valuable / least reliable / most expensive) until real outcome
 * tracking is wired. Tune the category table as real data lands.
 */

export interface RoiWorkflow {
  name: string
  category?: string | null
  active: boolean
  totalExecutions: number
  successRate7d?: number | null
  hasTags?: boolean
}

interface CategoryRate {
  minutesPerRun: number // manual-equivalent minutes saved per successful run
  costPerRun: number // estimated API cost ($) per run
  clientFacing: boolean
}

const DEFAULT_RATE: CategoryRate = { minutesPerRun: 10, costPerRun: 0.02, clientFacing: false }

const CATEGORY_RULES: Array<[RegExp, CategoryRate]> = [
  [/content|article|blog|write|html|redesign/i, { minutesPerRun: 45, costPerRun: 0.12, clientFacing: true }],
  [/image|nano|kie|fal/i, { minutesPerRun: 12, costPerRun: 0.08, clientFacing: true }],
  [/keyword|kw|serp|rank/i, { minutesPerRun: 25, costPerRun: 0.05, clientFacing: true }],
  [/audit|crawl|technical|onpage|on-page/i, { minutesPerRun: 30, costPerRun: 0.04, clientFacing: true }],
  [/backlink|ahrefs|link/i, { minutesPerRun: 20, costPerRun: 0.04, clientFacing: true }],
  [/report|summary|client/i, { minutesPerRun: 20, costPerRun: 0.06, clientFacing: true }],
  [/social|publish|publer/i, { minutesPerRun: 8, costPerRun: 0.02, clientFacing: true }],
  [/gbp|local|review/i, { minutesPerRun: 15, costPerRun: 0.03, clientFacing: true }],
  [/monitor|alert|cache|purge|cron/i, { minutesPerRun: 5, costPerRun: 0.01, clientFacing: false }],
]

function rateFor(wf: RoiWorkflow): CategoryRate {
  const hay = `${wf.category ?? ''} ${wf.name}`
  for (const [re, rate] of CATEGORY_RULES) if (re.test(hay)) return rate
  return DEFAULT_RATE
}

export function estimateManualHoursSaved(wf: RoiWorkflow): number {
  const rate = rateFor(wf)
  const successful = wf.totalExecutions * (wf.successRate7d ?? 1)
  return Math.round((successful * rate.minutesPerRun) / 60 * 10) / 10
}

export function estimateApiCost(wf: RoiWorkflow): number {
  const rate = rateFor(wf)
  return Math.round(wf.totalExecutions * rate.costPerRun * 100) / 100
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, n))
}

/** Business value score 0..100 (super-plan §13.2). Higher = more valuable. */
export function computeBusinessValue(wf: RoiWorkflow): number {
  const rate = rateFor(wf)
  const success = wf.successRate7d ?? 1
  const hours = estimateManualHoursSaved(wf)
  const cost = estimateApiCost(wf)

  const outcome = Math.min(wf.totalExecutions / 100, 1) * 30
  const timeSaved = Math.min(hours / 40, 1) * 25
  const clientVisibility = (rate.clientFacing ? 15 : 5) * (wf.active ? 1 : 0.5)
  const revenueImpact = success * 10

  const failurePenalty = (1 - success) * 20
  const costPenalty = Math.min(cost / 50, 1) * 10
  const manualReviewPenalty = wf.hasTags ? 0 : 5

  return Math.round(
    clamp(outcome + timeSaved + clientVisibility + revenueImpact - failurePenalty - costPenalty - manualReviewPenalty)
  )
}

export interface RoiSummary {
  totalRuns: number
  manualHoursSaved: number
  apiCostEstimate: number
  avgBusinessValue: number
}

export function summarizeRoi(workflows: RoiWorkflow[]): RoiSummary {
  let hours = 0
  let cost = 0
  let value = 0
  let runs = 0
  for (const wf of workflows) {
    hours += estimateManualHoursSaved(wf)
    cost += estimateApiCost(wf)
    value += computeBusinessValue(wf)
    runs += wf.totalExecutions
  }
  return {
    totalRuns: runs,
    manualHoursSaved: Math.round(hours * 10) / 10,
    apiCostEstimate: Math.round(cost * 100) / 100,
    avgBusinessValue: workflows.length ? Math.round(value / workflows.length) : 0,
  }
}
