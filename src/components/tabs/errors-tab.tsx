'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActionNotice } from '@/components/action-notice'
import { supabase } from '@/lib/supabase'
import { clusterErrors, type ErrExec, type ErrorCluster } from '@/lib/aggregate'
import { AlertOctagon, Bell, ExternalLink, Loader2, ShieldAlert } from 'lucide-react'

export function ErrorsTab() {
  const [clusters, setClusters] = useState<ErrorCluster[]>([])
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      const portfolio = await fetch('/api/n8n/portfolio', { headers }).then((r) => r.json()).catch(() => null)
      const failed = (portfolio?.failedExecutions || []) as any[]
      setRecent(failed)
      const execs: ErrExec[] = failed.map((e) => ({ n8nExecutionId: e.id, workflowName: e.workflowName, errorFingerprint: e.errorFingerprint ?? null, startedAt: e.startedAt }))
      setClusters(clusterErrors(execs))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const checkAlerts = async () => {
    setChecking(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/n8n/alerts', { method: 'POST', headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        const n = data.alerts?.length || 0
        setNotice({ type: n ? 'warning' : 'success', title: n ? `${n} alert(s)` : 'All clear', message: n ? data.alerts.map((a: any) => a.title).join(' · ') + ` (telegram: ${data.dispatched.telegram}, email: ${data.dispatched.email})` : 'No alert rules fired.' })
      } else {
        setNotice({ type: 'info', title: 'Alert check unavailable', message: data?.source === 'unconfigured' ? 'Run a sync and set notification credentials to enable alerts.' : 'Could not evaluate alerts.' })
      }
    } finally {
      setChecking(false)
    }
  }

  const sev = (s: ErrorCluster['severity']): 'danger' | 'warning' | 'default' =>
    s === 'critical' ? 'danger' : s === 'high' ? 'warning' : 'default'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><AlertOctagon className="w-6 h-6 text-red-500" /> Error Center</h1>
          <p className="text-slate-400 mt-1">Clustered failures, severity, and alert dispatch</p>
        </div>
        <Button variant="outline" size="sm" className="border-slate-700 text-slate-200" onClick={checkAlerts} disabled={checking}>
          {checking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
          Check alerts
        </Button>
      </div>

      {notice && <ActionNotice type={notice.type} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      {clusters.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8 text-center text-slate-400">
            No clustered failures in the recent window. Run a sync to populate execution history.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {clusters.map((c) => (
            <Card key={c.fingerprint} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                      <h3 className="font-semibold text-white truncate">{c.title}</h3>
                      <Badge variant={sev(c.severity)}>{c.severity}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      {c.occurrenceCount} failure(s) · {c.affectedWorkflows.length} workflow(s) · last {c.lastSeen ? new Date(c.lastSeen).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Recent failed executions</h2>
            <div className="space-y-2">
              {recent.slice(0, 12).map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-200 truncate">{e.workflowName}</span>
                  <span className="text-slate-500 shrink-0">{e.startedAt ? new Date(e.startedAt).toLocaleString() : '—'}</span>
                  {e.openInN8nUrl && <a href={e.openInN8nUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 shrink-0"><ExternalLink className="w-4 h-4" /></a>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
