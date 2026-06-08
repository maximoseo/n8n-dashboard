import { test } from 'node:test'
import assert from 'node:assert/strict'
import { redactSecrets, redactAll, redactString } from '../redaction.ts'

test('masks object keys that look secret', () => {
  const out = redactSecrets({
    name: 'workflow-1',
    apiKey: 'super-secret-value',
    nested: { authorization: 'Bearer abc', ok: 1 },
  }) as Record<string, any>
  assert.equal(out.name, 'workflow-1')
  assert.equal(out.apiKey, '[REDACTED]')
  assert.equal(out.nested.authorization, '[REDACTED]')
  assert.equal(out.nested.ok, 1)
})

test('redacts inline JWTs in strings', () => {
  // Built from segments so no contiguous JWT literal sits in source (keeps
  // secret-scanners from flagging this synthetic test vector).
  const header = 'eyJhbGciOiJIUzI1NiJ9'
  const payload = 'eyJzdWIiOiIxMjM0NSJ9'
  const sig = 'dBjftJeZ4CVP_mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  const jwt = [header, payload, sig].join('.')
  const out = redactString(`token is ${jwt} end`)
  assert.ok(out.includes('[REDACTED_JWT]'))
  assert.ok(!out.includes(header))
})

test('redacts provider-style keys', () => {
  assert.ok((redactString('use sk-abcdefabcdef1234567890') as string).includes('[REDACTED_KEY]'))
  assert.ok((redactString('ghp_0123456789abcdefghijABCDEFGHIJ') as string).includes('[REDACTED_KEY]'))
})

test('redactAll also strips email PII', () => {
  const out = redactAll({ msg: 'contact me at user@example.com please' }) as Record<string, any>
  assert.ok(out.msg.includes('[REDACTED_EMAIL]'))
  assert.ok(!out.msg.includes('example.com'))
})

test('handles circular references without throwing', () => {
  const a: any = { name: 'x' }
  a.self = a
  const out = redactSecrets(a) as Record<string, any>
  assert.equal(out.name, 'x')
  assert.equal(out.self, '[Circular]')
})

test('truncates oversized strings', () => {
  // Use a non-hex, non-token char so only the length rule applies.
  const big = 'z'.repeat(5000)
  const out = redactSecrets({ blob: big }) as Record<string, any>
  assert.ok(out.blob.length < 5000)
  assert.ok(out.blob.endsWith('…[truncated]'))
})
