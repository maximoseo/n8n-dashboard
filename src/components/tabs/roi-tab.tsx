'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { authedFetch, downloadResponse } from '@/lib/client-fetch'
import { Loader2, TrendingUp, Clock, DollarSign, Gauge, Download } from 'lucide-react'

interface Row { name: string; status: string; businessValue?: number | null; riskScore?: number | null; apiCost?: number | null }
interface Summary { totalRuns: number; manualHoursSaved: number; apiCostEstimate: number; avgBusinessValue: number }

function List({ title, rows, col, fmt }: { title: string; rows: Row[]; col: keyof Row; fmt?: (v: any) => string }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">{title}</h2>
        {rows.length === 0 ? (
          <p className="text-slate-500 text-sm">No data yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-200 truncate">{r.name}</span>
                <span className="text-slate-400 shrink-0">{fmt ? fmt(r[col]) : String(r[col] ?? '—')}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function RoiTab() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [topValuable, setTopValuable] = useState<Row[]>([])
  const [leastReliable, setLeastReliable] = useState<Row[]>([])
  const [mostExpensive, setMostExpensive] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await authedFetch('/api/n8n/roi')
        const data = await res.json().catch(() => null)
        setSummary(data?.summary || null)
        setTopValuable(data?.topValuable || [])
        setLeastReliable(data?.leastReliable || [])
        setMostExpensive(data?.mostExpensive || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const exportReport = async (format: 'md' | 'csv' | 'json') => {
    const res = await authedFetch(`/api/reports?format=${format}`)
    if (!res.ok) return
    if (format === 'json') {
      const text = JSON.stringify(await res.json(), null, 2)
      const blob = new Blob([text], { type: 'application/json' })
      await downloadResponse(new Response(blob), 'n8n-ops-report.json')
    } else {
      await downloadResponse(res, `n8n-ops-report.${format}`)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingUp className="w-6 h-6 text-blue-500" /> Business Results &amp; ROI</h1>
          <p className="text-slate-400 mt-1">Estimated value, time saved, and cost per automation</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={() => exportReport('md')}><Download className="w-4 h-4 mr-2" /> MD</Button>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={() => exportReport('csv')}><Download className="w-4 h-4 mr-2" /> CSV</Button>
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={() => exportReport('json')}><Download className="w-4 h-4 mr-2" /> JSON</Button>
        </div>
      </div>

      {!summary ? (
        <Card className="bg-slate-900 border-slate-800"><CardContent className="p-8 text-center text-slate-400">Run a sync to populate ROI estimates.</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="bg-slate-900 border-slate-800"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">Manual hours saved</span><Clock className="w-4 h-4 text-green-400" /></div><div className="mt-2 text-2xl font-bold text-white">{summary.manualHoursSaved}</div><div className="text-xs text-slate-500">estimate</div></CardContent></Card>
            <Card className="bg-slate-900 border-slate-800"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">API cost</span><DollarSign className="w-4 h-4 text-yellow-400" /></div><div className="mt-2 text-2xl font-bold text-white">${summary.apiCostEstimate}</div><div className="text-xs text-slate-500">estimate</div></CardContent></Card>
            <Card className="bg-slate-900 border-slate-800"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">Avg business value</span><Gauge className="w-4 h-4 text-blue-400" /></div><div className="mt-2 text-2xl font-bold text-white">{summary.avgBusinessValue}</div><div className="text-xs text-slate-500">0–100</div></CardContent></Card>
            <Card className="bg-slate-900 border-slate-800"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">Total runs</span><TrendingUp className="w-4 h-4 text-blue-400" /></div><div className="mt-2 text-2xl font-bold text-white">{summary.totalRuns.toLocaleString()}</div></CardContent></Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <List title="Top 10 most valuable" rows={topValuable} col="businessValue" />
            <List title="Top 10 least reliable" rows={leastReliable} col="riskScore" />
            <List title="Top 10 most expensive" rows={mostExpensive} col="apiCost" fmt={(v) => `$${v ?? 0}`} />
          </div>
        </>
      )}
    </div>
  )
}
