import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimateManualHoursSaved, estimateApiCost, computeBusinessValue, summarizeRoi, type RoiWorkflow } from '../roi.ts'

const content: RoiWorkflow = { name: 'Article writer', category: 'content', active: true, totalExecutions: 100, successRate7d: 1, hasTags: true }
const monitor: RoiWorkflow = { name: 'cache purge', category: 'monitoring', active: true, totalExecutions: 100, successRate7d: 1, hasTags: true }

test('content workflows save more manual hours than monitoring', () => {
  assert.ok(estimateManualHoursSaved(content) > estimateManualHoursSaved(monitor))
  // 100 runs * 45min / 60 = 75h
  assert.equal(estimateManualHoursSaved(content), 75)
})

test('api cost scales with category', () => {
  assert.ok(estimateApiCost(content) > estimateApiCost(monitor))
  assert.equal(estimateApiCost(content), 12) // 100 * 0.12
})

test('business value is bounded and rewards reliable client-facing volume', () => {
  const v = computeBusinessValue(content)
  assert.ok(v >= 0 && v <= 100)
  const flaky = computeBusinessValue({ ...content, successRate7d: 0.2 })
  assert.ok(flaky < v)
})

test('summarizeRoi aggregates', () => {
  const s = summarizeRoi([content, monitor])
  assert.equal(s.totalRuns, 200)
  assert.ok(s.manualHoursSaved > 0)
  assert.ok(s.apiCostEstimate > 0)
  assert.ok(s.avgBusinessValue >= 0 && s.avgBusinessValue <= 100)
})

test('empty input is safe', () => {
  const s = summarizeRoi([])
  assert.equal(s.totalRuns, 0)
  assert.equal(s.avgBusinessValue, 0)
})
