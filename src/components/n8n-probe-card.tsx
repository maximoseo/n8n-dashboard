'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Server, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ProbeCheck {
  target: 'workflows' | 'executions'
  ok: boolean
  statusCode?: number
  latencyMs: number
  payloadRef: string
}

interface ProbeInstance {
  id: string
  name: string
  instanceUrl: string
  host: string
  configured: boolean
  status: 'reachable' | 'unreachable' | 'unconfigured' | 'auth_failed'
  checkedAt: string
  latencyMs: number
  error?: string
  checks: ProbeCheck[]
  evidence: {
    instance_url: string
    ts: string
    payload_ref: string
  }
}

interface ProbeResponse {
  checkedAt: string
  instances: ProbeInstance[]
  summary: {
    total: number
    reachable: number
    authFailed?: number
    unreachable: number
    unconfigured: number
  }
}

function badgeVariant(status: ProbeInstance['status']) {
  if (status === 'reachable') return 'success'
  if (status === 'unconfigured') return 'warning'
  if (status === 'auth_failed') return 'warning'
  return 'danger'
}

function statusIcon(status: ProbeInstance['status']) {
  if (status === 'reachable') return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
  if (status === 'unconfigured') return <AlertTriangle className="h-4 w-4" aria-hidden="true" />
  return <Activity className="h-4 w-4" aria-hidden="true" />
}

function statusLabel(status: ProbeInstance['status']) {
  if (status === 'auth_failed') return 'Auth failed'
  return status
}

function formatEvidenceTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value || 'unknown time' : date.toLocaleString()
}

async function readProbeError(response: Response): Promise<string> {
  const fallback = `Probe failed with HTTP ${response.status}`
  try {
    const body = await response.clone().json()
    if (typeof body?.error === 'string' && body.error.trim()) return body.error.trim()
  } catch {
    // Fall through to a bounded text fallback. This is the dashboard endpoint response, not upstream n8n data.
  }

  try {
    const text = (await response.text()).replace(/\s+/g, ' ').trim()
    return text ? text.slice(0, 160) : fallback
  } catch {
    return fallback
  }
}

export function N8nProbeCard() {
  const [data, setData] = useState<ProbeResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const probeAbortControllerRef = useRef<AbortController | null>(null)

  const loadProbe = useCallback(async () => {
    probeAbortControllerRef.current?.abort()
    const controller = new AbortController()
    probeAbortControllerRef.current = controller
    setLoading(true)
    setError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      const response = await fetch('/api/n8n/probe', { headers, cache: 'no-store', signal: controller.signal })
      if (!response.ok) {
        throw new Error(await readProbeError(response))
      }
      const body = await response.json()
      setData(body)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Probe failed')
    } finally {
      if (probeAbortControllerRef.current === controller) {
        probeAbortControllerRef.current = null
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadProbe()
    return () => probeAbortControllerRef.current?.abort()
  }, [loadProbe])

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-white">
              <Server className="h-5 w-5 text-pink-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold">n8n instance connectivity</h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Live read-only API checks. No mock data is shown when an instance is disconnected.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadProbe()}
            disabled={loading}
            className="w-full border-slate-700 text-slate-100 hover:bg-slate-800 sm:w-auto"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {loading && !data ? (
          <div className="mt-4 flex min-h-24 items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking n8n instances…
          </div>
        ) : error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : data ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4 sm:max-w-2xl">
              <div className="rounded-lg bg-slate-950 p-3">
                <div className="text-xl font-bold text-green-400">{data.summary.reachable}</div>
                <div className="text-slate-500">Reachable</div>
              </div>
              <div className="rounded-lg bg-slate-950 p-3">
                <div className="text-xl font-bold text-yellow-400">{data.summary.unconfigured}</div>
                <div className="text-slate-500">Unconfigured</div>
              </div>
              <div className="rounded-lg bg-slate-950 p-3">
                <div className="text-xl font-bold text-orange-400">{data.summary.authFailed ?? 0}</div>
                <div className="text-slate-500">Auth failed</div>
              </div>
              <div className="rounded-lg bg-slate-950 p-3">
                <div className="text-xl font-bold text-red-400">{data.summary.unreachable}</div>
                <div className="text-slate-500">Unreachable</div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {data.instances.map((instance) => (
                <div key={instance.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-100">{instance.name}</span>
                        <Badge variant={badgeVariant(instance.status)} className="gap-1 capitalize">
                          {statusIcon(instance.status)} {statusLabel(instance.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-400">{instance.host}</p>
                    </div>
                    <div className="text-sm text-slate-500 sm:text-right">
                      {instance.latencyMs != null ? `${instance.latencyMs}ms` : '—'}
                    </div>
                  </div>

                  {instance.error && (
                    <p className="mt-3 rounded-lg bg-slate-900 p-3 text-sm text-slate-300">{instance.error}</p>
                  )}

                  {instance.checks.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {instance.checks.map((check) => (
                        <div key={check.target} className="rounded-lg bg-slate-900 p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="capitalize text-slate-300">{check.target}</span>
                            <span className={check.ok ? 'text-green-400' : 'text-red-400'}>
                              HTTP {check.statusCode ?? '—'}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{check.latencyMs}ms · {check.payloadRef}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                    <span className="break-words">
                      Evidence: {instance.evidence.payload_ref} at {formatEvidenceTime(instance.evidence.ts)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
