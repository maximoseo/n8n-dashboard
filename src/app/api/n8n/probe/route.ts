import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { getN8nInstances } from '@/lib/n8n/instances'
import { probeN8nInstance } from '@/lib/n8n/probe'

export const dynamic = 'force-dynamic'
const PROBE_ROUTE_TIMEOUT_MS = 20_000

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Probe request timed out')), ms)
    promise
      .then(resolve, reject)
      .finally(() => clearTimeout(timer))
  })
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response

  const checkedAt = new Date().toISOString()
  const instances = getN8nInstances({ includeSecrets: true })
  let results
  try {
    results = await timeout(
      Promise.all(instances.map((instance) => probeN8nInstance(instance, checkedAt))),
      PROBE_ROUTE_TIMEOUT_MS
    )
  } catch {
    return NextResponse.json({ error: 'n8n probe timed out', checkedAt }, { status: 504 })
  }

  return NextResponse.json({
    checkedAt,
    instances: results,
    summary: {
      total: results.length,
      reachable: results.filter((instance) => instance.status === 'reachable').length,
      authFailed: results.filter((instance) => instance.status === 'auth_failed').length,
      unreachable: results.filter((instance) => instance.status === 'unreachable').length,
      unconfigured: results.filter((instance) => instance.status === 'unconfigured').length,
    },
  })
}
