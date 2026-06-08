'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ActionNotice } from '@/components/action-notice'
import { authedFetch } from '@/lib/client-fetch'
import { Loader2, Boxes, Play } from 'lucide-react'

interface PackChild { key: string; label: string; services: string[] }
interface Pack { id: string; name: string; description: string; children: PackChild[] }
interface PackRun { id: string; pack_id: string; domain: string; status: string; overall_score: number | null; triggered_via: string; created_at: string }

export function SeoPacksTab() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [runs, setRuns] = useState<PackRun[]>([])
  const [loading, setLoading] = useState(true)
  const [domain, setDomain] = useState('')
  const [running, setRunning] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('/api/seo/packs')
      const data = await res.json().catch(() => null)
      setPacks(data?.packs || [])
      setRuns(data?.runs || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const runPack = async (packId: string) => {
    if (!domain.trim()) { setNotice({ type: 'warning', title: 'Domain required', message: 'Enter a site domain to run a pack.' }); return }
    setRunning(packId)
    try {
      const res = await authedFetch('/api/seo/packs/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packId, domain: domain.trim() }) })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setNotice({ type: 'success', title: 'Pack run started', message: `Run ${data.runId.slice(0, 8)} · ${data.triggeredVia === 'webhook' ? `delegated to n8n (${data.webhook})` : 'recorded (configure N8N_SITE_PACK_WEBHOOK_URL to execute)'}` })
        await load()
      } else {
        setNotice({ type: 'error', title: 'Could not start run', message: data?.error || 'Run failed.' })
      }
    } finally {
      setRunning(null)
    }
  }

  const statusVariant = (s: string): 'success' | 'danger' | 'warning' | 'secondary' =>
    s === 'completed' ? 'success' : s === 'failed' ? 'danger' : s === 'partial' ? 'warning' : 'secondary'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Boxes className="w-6 h-6 text-blue-500" /> SEO Automation Packs</h1>
        <p className="text-slate-400 mt-1">Run grouped, n8n-orchestrated SEO analyses per site (one run, shared correlation id)</p>
      </div>

      {notice && <ActionNotice type={notice.type} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm text-slate-400">Target site</span>
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="bg-slate-950 border-slate-700 text-white max-w-xs" />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {packs.map((p) => (
            <Card key={p.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{p.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{p.description}</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0" onClick={() => runPack(p.id)} disabled={running === p.id}>
                    {running === p.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />} Run
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.children.map((c) => (
                    <Badge key={c.key} variant="outline" className="border-slate-700 text-slate-400 text-xs">{c.label}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {runs.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Recent runs</h2>
            <div className="space-y-2">
              {runs.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-200 truncate">{r.domain}</span>
                  <span className="text-slate-500 truncate hidden sm:inline">{r.pack_id}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.overall_score != null && <span className="text-slate-400">{r.overall_score}</span>}
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
