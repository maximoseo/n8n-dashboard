import type { N8nInstanceDefinition } from './instances'

export type N8nProbeStatus = 'reachable' | 'unreachable' | 'unconfigured' | 'auth_failed'
export type N8nProbeTarget = 'workflows' | 'executions'

export interface N8nEndpointProbe {
  target: N8nProbeTarget
  ok: boolean
  statusCode?: number
  latencyMs: number
  payloadRef: string
}

export interface N8nInstanceProbeResult {
  id: N8nInstanceDefinition['id']
  name: string
  instanceUrl: string
  host: string
  configured: boolean
  status: N8nProbeStatus
  checkedAt: string
  latencyMs: number
  error?: string
  checks: N8nEndpointProbe[]
  evidence: {
    instance_url: string
    ts: string
    payload_ref: string
  }
}

const PROBE_TIMEOUT_MS = 15_000

export function sanitizeProbeError(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') return 'Timeout'
  if (error instanceof TypeError) return 'Network error'
  return 'Probe failed'
}

async function probeEndpoint(
  baseUrl: string,
  apiKey: string,
  target: N8nProbeTarget,
  path: string
): Promise<N8nEndpointProbe> {
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    return {
      target,
      ok: response.ok,
      statusCode: response.status,
      latencyMs: Date.now() - started,
      payloadRef: `n8n-api:${target}`,
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function probeN8nInstance(
  instance: N8nInstanceDefinition,
  checkedAt = new Date().toISOString()
): Promise<N8nInstanceProbeResult> {
  const evidence = {
    instance_url: instance.baseUrl,
    ts: checkedAt,
    payload_ref: 'n8n-api:workflows,n8n-api:executions',
  }

  if (!instance.apiKey) {
    return {
      id: instance.id,
      name: instance.name,
      instanceUrl: instance.baseUrl,
      host: instance.host,
      configured: false,
      status: 'unconfigured',
      checkedAt,
      latencyMs: 0,
      error: 'Connect an n8n instance by configuring its server-side API key.',
      checks: [],
      evidence,
    }
  }

  const started = Date.now()
  try {
    const checks = await Promise.all([
      probeEndpoint(instance.baseUrl, instance.apiKey, 'workflows', '/api/v1/workflows?limit=1'),
      probeEndpoint(instance.baseUrl, instance.apiKey, 'executions', '/api/v1/executions?limit=1'),
    ])
    const ok = checks.every((check) => check.ok)
    const authFailure = checks.some((check) => check.statusCode === 401 || check.statusCode === 403)
    const firstFailure = checks.find((check) => !check.ok)

    return {
      id: instance.id,
      name: instance.name,
      instanceUrl: instance.baseUrl,
      host: instance.host,
      configured: true,
      status: ok ? 'reachable' : authFailure ? 'auth_failed' : 'unreachable',
      checkedAt,
      latencyMs: Date.now() - started,
      ...(authFailure
        ? { error: 'n8n API authentication failed. Rotate/provision the server-side key.' }
        : firstFailure
          ? { error: `HTTP ${firstFailure.statusCode ?? 'error'}` }
          : {}),
      checks,
      evidence,
    }
  } catch (error) {
    return {
      id: instance.id,
      name: instance.name,
      instanceUrl: instance.baseUrl,
      host: instance.host,
      configured: true,
      status: 'unreachable',
      checkedAt,
      latencyMs: Date.now() - started,
      error: sanitizeProbeError(error),
      checks: [],
      evidence,
    }
  }
}
