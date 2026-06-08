import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateWorkflowDocs } from '../n8n/docs.ts'

test('generates markdown with status, triggers, services, inventory', () => {
  const md = generateWorkflowDocs({
    id: 'abc',
    name: 'SEO Crawl',
    active: true,
    tags: [{ name: 'seo' }, 'monitoring'],
    nodes: [
      { name: 'Schedule', type: 'n8n-nodes-base.scheduleTrigger' },
      { name: 'Fetch', type: 'n8n-nodes-base.httpRequest', credentials: { httpHeaderAuth: { name: 'API' } } },
      { name: 'Fetch2', type: 'n8n-nodes-base.httpRequest' },
    ],
  })
  assert.ok(md.includes('# SEO Crawl'))
  assert.ok(md.includes('**Status:** active'))
  assert.ok(md.includes('**Nodes:** 3'))
  assert.ok(md.includes('seo, monitoring'))
  assert.ok(md.includes('Schedule')) // trigger listed
  assert.ok(md.includes('httpRequest × 2')) // inventory count
  assert.ok(md.includes('httpHeaderAuth')) // service from credential type
})

test('handles empty/missing fields gracefully', () => {
  const md = generateWorkflowDocs({})
  assert.ok(md.includes('Untitled workflow'))
  assert.ok(md.includes('**Status:** inactive'))
  assert.ok(md.includes('No trigger nodes detected'))
})
