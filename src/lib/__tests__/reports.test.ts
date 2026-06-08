import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildOpsReportMarkdown, rowsToCsv, type OpsReport } from '../reports.ts'

const report: OpsReport = {
  generatedAt: '2026-06-08T00:00:00Z',
  totals: { workflows: 3, active: 2, failing: 1, atRisk: 1, manualHoursSaved: 120.5, apiCostEstimate: 8.4, avgBusinessValue: 62 },
  topValuable: [{ name: 'Writer', status: 'active', businessValue: 88 }],
  leastReliable: [{ name: 'Flaky', status: 'error', riskScore: 71 }],
  mostExpensive: [{ name: 'AI heavy', status: 'active', apiCost: 12.5 }],
}

test('markdown report includes totals and sections', () => {
  const md = buildOpsReportMarkdown(report)
  assert.ok(md.includes('Internal Ops Report'))
  assert.ok(md.includes('Est. manual hours saved: 120.5'))
  assert.ok(md.includes('Top 10 most valuable'))
  assert.ok(md.includes('Writer'))
})

test('csv escapes commas and quotes', () => {
  const csv = rowsToCsv([{ name: 'a,b "x"', status: 'active', healthScore: 90, businessValue: 50 }])
  assert.ok(csv.split('\n')[0].startsWith('name,status'))
  assert.ok(csv.includes('"a,b ""x"""'))
})
