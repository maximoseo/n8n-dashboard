'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import {
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface WorkflowSummary {
  total: number
  active: number
  paused: number
  errors: number
  source: string
}

export function AnalyticsTab() {
  const [summary, setSummary] = useState<WorkflowSummary | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch('/api/n8n/workflows', {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.error || 'Workflow analytics unavailable')

        const workflows = data.workflows || []
        setSummary({
          total: data.count || workflows.length,
          active: workflows.filter((workflow: { status: string }) => workflow.status === 'active').length,
          paused: workflows.filter((workflow: { status: string }) => workflow.status === 'paused').length,
          errors: workflows.filter((workflow: { status: string }) => workflow.status === 'error').length,
          source: data.source || 'unknown',
        })
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Analytics unavailable')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  const stats = summary
    ? [
        { label: 'Total Workflows', value: summary.total.toLocaleString() },
        { label: 'Active Workflows', value: summary.active.toLocaleString() },
        { label: 'Paused Workflows', value: summary.paused.toLocaleString() },
        { label: 'Workflow Errors', value: summary.errors.toLocaleString() },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          Analytics
        </h1>
        <p className="text-slate-400 mt-1">Live workflow analytics from the connected n8n account</p>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 text-red-400">{error}</CardContent>
        </Card>
      )}

      {!isLoading && summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <span className="mt-2 block text-2xl font-bold text-white">{stat.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Live Data Source
                </CardTitle>
                <CardDescription className="text-slate-400">No synthetic activity is shown here</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-slate-800 p-4 text-sm text-slate-300">
                  Analytics are calculated from the live n8n workflow API. Detailed run charts need a dedicated analytics store or time-series endpoint.
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  System Status
                </CardTitle>
                <CardDescription className="text-slate-400">Component health and availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <span className="text-white">n8n API</span>
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {summary.source}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <span className="text-white">Detailed Activity Stream</span>
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not connected
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
