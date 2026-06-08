import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SEO_PACKS, getPack, packServices, computePackScore, isValidDomain } from '../seo-packs.ts'

test('catalog is well-formed', () => {
  assert.ok(SEO_PACKS.length >= 8)
  for (const p of SEO_PACKS) {
    assert.ok(p.id && p.name && p.children.length > 0)
    for (const c of p.children) assert.ok(c.key && c.label && Array.isArray(c.services))
  }
  assert.ok(getPack('full_site_analysis'))
  assert.equal(getPack('nope'), undefined)
})

test('packServices dedupes and sorts', () => {
  const svc = packServices(getPack('full_site_analysis')!)
  assert.ok(svc.includes('dataforseo'))
  assert.deepEqual(svc, [...new Set(svc)].sort())
})

test('computePackScore averages valid scores', () => {
  assert.equal(computePackScore([80, 100, null, undefined]), 90)
  assert.equal(computePackScore([]), null)
})

test('isValidDomain validates', () => {
  assert.ok(isValidDomain('example.com'))
  assert.ok(isValidDomain('https://sub.example.co.il/path'))
  assert.ok(!isValidDomain('not a domain'))
  assert.ok(!isValidDomain(''))
})
