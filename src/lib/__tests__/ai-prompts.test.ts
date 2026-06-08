import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildWorkflowSpecPrompt, buildFailureAnalysisPrompt } from '../ai-prompts.ts'

test('workflow spec prompt embeds goal and safety rules', () => {
  const p = buildWorkflowSpecPrompt('weekly keyword check for client sites', { client: 'acme', trigger: 'schedule' })
  assert.ok(p.includes('weekly keyword check for client sites'))
  assert.ok(p.includes('acme'))
  assert.ok(p.includes('schedule'))
  assert.ok(/never values/i.test(p)) // safety: no secret values
  assert.ok(/human review/i.test(p)) // no auto-activation
})

test('failure analysis prompt is redaction-aware and structured', () => {
  const p = buildFailureAnalysisPrompt({ workflowName: 'A', occurrences: 5, affectedWorkflows: 2, lastSeen: '2026-06-01', sampleError: '[REDACTED]' })
  assert.ok(p.includes('already redacted'))
  assert.ok(p.includes('Occurrences: 5'))
  assert.ok(/root cause/i.test(p))
})
