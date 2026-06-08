'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { computeOverviewKpis, type KpiWorkflow, type OverviewKpis } from '@/lib/aggregate'
import { Activity, AlertTriangle, CheckCircle2, Gauge, Loader2, Pause, ShieldAlert, Workflow, Zap } from 'lucide-react'

interface PortfolioWorkflow extends KpiWorkflow {
  id: string
  name: string
  riskScore?: number | null
  openInN8nUrl?: string
}

function Metric({ label, value, sub, icon, tone = 'default' }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const ring = tone === 'good' ? 'text-green-400' : tone === 'warn' ? 'text-yellow-400' : tone === 'bad' ? 'text-red-400' : 'text-blue-400'
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{label}</span>
          <span className={ring}>{icon}</span>
        </div>
        <div className="mt-2 text-2xl font-bold text-white">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export function OverviewTab() {
  const [kpis, setKpis] = useState<OverviewKpis | null>(null)
  const [atRisk, setAtRisk] = useState<PortfolioWorkflow[]>([])
  const [source, setSource] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        let workflows: PortfolioWorkflow[] = []
        const portfolio = await fetch('/api/n8n/portfolio', { headers }).then((r) => r.json()).catch(() => null)
        if (portfolio?.source === 'supabase' && portfolio.workflows?.length) {
          workflows = portfolio.workflows
          setSource('Synced')
        } else {
          const live = await fetch('/api/n8n/workflows', { headers }).then((r) => r.json()).catch(() => null)
          workflows = (live?.workflows || []).map((w: any) => ({ ...w, healthBand: null }))
          setSource('Live n8n (run a sync for health scores)')
        }
        setKpis(computeOverviewKpis(workflows))
        setAtRisk(
          [...workflows]
            .filter((w) => typeof w.riskScore === 'number')
            .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
            .slice(0, 8)
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
  }
  if (!kpis) return <div className="text-slate-400">No data.</div>

  const pct = (n: number | null) => (n == null ? '—' : `${Math.round(n * 100)}%`)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Gauge className="w-6 h-6 text-blue-500" /> Executive Overview</h1>
        <p className="text-slate-400 mt-1">Automation health at a glance · source: {source}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Metric label="Total workflows" value={kpis.total} icon={<Workflow className="w-4 h-4" />} />
        <Metric label="Active" value={kpis.active} icon={<Zap className="w-4 h-4" />} tone="good" />
        <Metric label="Paused" value={kpis.paused} icon={<Pause className="w-4 h-4" />} tone="warn" />
        <Metric label="Failing (last run)" value={kpis.failing} icon={<AlertTriangle className="w-4 h-4" />} tone={kpis.failing ? 'bad' : 'good'} />
        <Metric label="At risk" value={kpis.atRisk} sub="Risky or Critical" icon={<ShieldAlert className="w-4 h-4" />} tone={kpis.atRisk ? 'bad' : 'good'} />
        <Metric label="Avg 7d success" value={pct(kpis.avgSuccessRate7d)} icon={<CheckCircle2 className="w-4 h-4" />} tone={kpis.avgSuccessRate7d != null && kpis.avgSuccessRate7d < 0.7 ? 'warn' : 'good'} />
        <Metric label="Healthy" value={pct(kpis.healthyPct)} icon={<Activity className="w-4 h-4" />} tone="good" />
        <Metric label="Total runs" value={kpis.totalRuns.toLocaleString()} icon={<Activity className="w-4 h-4" />} />
        <Metric label="Avg duration" value={kpis.avgDurationMs == null ? '—' : `${Math.round(kpis.avgDurationMs / 1000)}s`} icon={<Activity className="w-4 h-4" />} />
        <Metric label="Without metadata" value={kpis.withoutMetadata} sub="no tags/category" icon={<AlertTriangle className="w-4 h-4" />} tone={kpis.withoutMetadata ? 'warn' : 'good'} />
      </div>

      {atRisk.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Highest-risk workflows</h2>
            <div className="space-y-2">
              {atRisk.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-200 truncate">{w.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {w.healthBand && <Badge variant={w.healthBand === 'Critical' || w.healthBand === 'Risky' ? 'danger' : w.healthBand === 'Paused' ? 'secondary' : 'success'}>{w.healthBand}</Badge>}
                    <span className="text-slate-500">risk {w.riskScore}</span>
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
