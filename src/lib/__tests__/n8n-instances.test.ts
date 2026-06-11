import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { getN8nInstances, getPublicN8nInstances, n8nEnvHealth, normalizeN8nBaseUrl } from '../n8n/instances.ts'
import { probeN8nInstance, sanitizeProbeError } from '../n8n/probe.ts'

const ENV_KEYS = [
  'N8N_API_KEY',
  'N8N_BASE_URL',
  'N8N_INSTANCE_1_URL',
  'N8N_INSTANCE_1_API_KEY',
  'N8N_INSTANCE_2_URL',
  'N8N_INSTANCE_2_API_KEY',
  'N8N_MAXIMOSEO_BASE_URL',
  'N8N_MAXIMOSEO_API_KEY',
  'N8N_WEBSISEO_BASE_URL',
  'N8N_WEBSISEO_API_KEY',
]

let originalEnv: Record<string, string | undefined>

beforeEach(() => {
  originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
  for (const key of ENV_KEYS) delete process.env[key]
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key]
    if (typeof value === 'string') process.env[key] = value
    else delete process.env[key]
  }
})

test('registry returns both known instances and degrades to unconfigured without keys', () => {
  const instances = getN8nInstances()
  assert.equal(instances.length, 2)
  assert.deepEqual(
    instances.map((instance) => instance.id).sort(),
    ['maximoseo', 'websiseo']
  )
  assert.equal(instances.every((instance) => instance.configured === false), true)

  const health = n8nEnvHealth()
  assert.equal(health.ok, false)
  assert.equal(health.configured, 0)
  assert.equal(health.total, 2)
})

test('public registry serialization never includes configured API key values', () => {
  process.env.N8N_INSTANCE_1_API_KEY = 'fixture-maximoseo-key-value'
  process.env.N8N_INSTANCE_2_API_KEY = 'fixture-websiseo-key-value'

  const internal = getN8nInstances({ includeSecrets: true })
  assert.equal(internal.filter((instance) => instance.configured).length, 2)

  const publicJson = JSON.stringify(getPublicN8nInstances())
  assert.equal(publicJson.includes('fixture-maximoseo-key-value'), false)
  assert.equal(publicJson.includes('fixture-websiseo-key-value'), false)
  assert.equal(publicJson.includes('"apiKey"'), false)
})

test('legacy N8N_API_KEY remains a websiseo fallback only', () => {
  process.env.N8N_API_KEY = 'legacy-websiseo-key'
  const instances = getN8nInstances({ includeSecrets: true })
  const websiseo = instances.find((instance) => instance.id === 'websiseo')
  const maximoseo = instances.find((instance) => instance.id === 'maximoseo')

  assert.equal(websiseo?.configured, true)
  assert.equal(websiseo?.apiKey, 'legacy-websiseo-key')
  assert.equal(maximoseo?.configured, false)
})

test('normalizeN8nBaseUrl rejects non-allowlisted and non-HTTPS hosts', () => {
  assert.deepEqual(normalizeN8nBaseUrl('https://websiseo.app.n8n.cloud/path?token=abc'), {
    baseUrl: 'https://websiseo.app.n8n.cloud',
    host: 'websiseo.app.n8n.cloud',
  })
  assert.throws(() => normalizeN8nBaseUrl('http://websiseo.app.n8n.cloud'))
  assert.throws(() => normalizeN8nBaseUrl('https://evil.example.com'))
})

test('probe error sanitization avoids raw error message leakage', () => {
  const raw = new Error('request failed with token=secret-websiseo-value-should-not-leak')
  assert.equal(sanitizeProbeError(raw), 'Probe failed')
  assert.equal(sanitizeProbeError(new TypeError('fetch failed')), 'Network error')
})

test('probe distinguishes n8n API auth failure from network outage', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => new Response('{}', { status: 401 })) as typeof fetch

  try {
    const result = await probeN8nInstance({
      id: 'websiseo',
      name: 'Websiseo n8n',
      baseUrl: 'https://websiseo.app.n8n.cloud',
      host: 'websiseo.app.n8n.cloud',
      apiKeyEnvNames: ['N8N_API_KEY'],
      configured: true,
      apiKey: 'fixture-key',
    })

    assert.equal(result.status, 'auth_failed')
    assert.equal(JSON.stringify(result).includes('fixture-key'), false)
  } finally {
    globalThis.fetch = originalFetch
  }
})
