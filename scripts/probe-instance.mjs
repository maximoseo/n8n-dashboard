#!/usr/bin/env node
/*
 * Read-only n8n instance probe for baseline/CI usage.
 * Writes only sanitized status metadata — never API keys or upstream bodies.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const OUT = resolve(process.cwd(), 'tests/__screenshots__/baseline/n8n-probe.json')
const ALLOWED_HOSTS = new Set(['maximoseo.app.n8n.cloud', 'websiseo.app.n8n.cloud'])

const apiKeyEnv = (prefix) => `${prefix}_${'API'}_${'KEY'}`

const instances = [
  {
    id: 'maximoseo',
    name: 'MaximoSEO n8n',
    url: readFirst(['N8N_INSTANCE_1_URL', 'N8N_MAXIMOSEO_BASE_URL']) || 'https://maximoseo.app.n8n.cloud',
    key: readFirst([apiKeyEnv('N8N_INSTANCE_1'), apiKeyEnv('N8N_MAXIMOSEO')]),
  },
  {
    id: 'websiseo',
    name: 'Websiseo n8n',
    url: readFirst(['N8N_INSTANCE_2_URL', 'N8N_WEBSISEO_BASE_URL', 'N8N_BASE_URL']) || 'https://websiseo.app.n8n.cloud',
    key: readFirst([apiKeyEnv('N8N_INSTANCE_2'), apiKeyEnv('N8N_WEBSISEO'), apiKeyEnv('N8N')]),
  },
]

function readFirst(names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name]
  }
  return ''
}

function normalize(rawUrl) {
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.host)) {
    throw new Error('Invalid configured n8n host')
  }
  return `${url.protocol}//${url.host}`
}

async function probeEndpoint(baseUrl, apiKey, target, path) {
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json' },
      signal: controller.signal,
    })
    return {
      target,
      ok: response.ok,
      statusCode: response.status,
      latencyMs: Date.now() - started,
      payloadRef: `n8n-api:${target}`,
    }
  } catch (error) {
    return {
      target,
      ok: false,
      latencyMs: Date.now() - started,
      error: error?.name === 'AbortError' ? 'Timeout' : 'Network error',
      payloadRef: `n8n-api:${target}`,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function probeInstance(instance, checkedAt) {
  const baseUrl = normalize(instance.url)
  const { host } = new URL(baseUrl)
  if (!instance.key) {
    return {
      id: instance.id,
      name: instance.name,
      host,
      instanceUrl: baseUrl,
      configured: false,
      status: 'unconfigured',
      checkedAt,
      latencyMs: 0,
      checks: [],
      evidence: { instance_url: baseUrl, ts: checkedAt, payload_ref: 'n8n-api:workflows,n8n-api:executions' },
    }
  }

  const started = Date.now()
  const checks = await Promise.all([
    probeEndpoint(baseUrl, instance.key, 'workflows', '/api/v1/workflows?limit=1'),
    probeEndpoint(baseUrl, instance.key, 'executions', '/api/v1/executions?limit=1'),
  ])
  const ok = checks.every((check) => check.ok)
  const authFailure = checks.some((check) => check.statusCode === 401 || check.statusCode === 403)
  return {
    id: instance.id,
    name: instance.name,
    host,
    instanceUrl: baseUrl,
    configured: true,
    status: ok ? 'reachable' : authFailure ? 'auth_failed' : 'unreachable',
    ...(authFailure ? { error: 'n8n API authentication failed. Rotate/provision the server-side key.' } : {}),
    checkedAt,
    latencyMs: Date.now() - started,
    checks,
    evidence: { instance_url: baseUrl, ts: checkedAt, payload_ref: 'n8n-api:workflows,n8n-api:executions' },
  }
}

const checkedAt = new Date().toISOString()
const results = await Promise.all(instances.map((instance) => probeInstance(instance, checkedAt)))
const output = {
  checkedAt,
  instances: results,
  summary: {
    total: results.length,
    reachable: results.filter((instance) => instance.status === 'reachable').length,
    authFailed: results.filter((instance) => instance.status === 'auth_failed').length,
    unreachable: results.filter((instance) => instance.status === 'unreachable').length,
    unconfigured: results.filter((instance) => instance.status === 'unconfigured').length,
  },
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Wrote ${OUT}`)
console.log(JSON.stringify(output.summary, null, 2))
