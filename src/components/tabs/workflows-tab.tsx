'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SheetMappingModal, SheetLinkButton, type SheetMapping, type SheetMappingData } from '@/components/sheet-mapping-modal'
import { ActionNotice } from '@/components/action-notice'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { supabase } from '@/lib/supabase'
import { authedFetch, downloadResponse, downloadText } from '@/lib/client-fetch'
import {
  Play,
  Pause,
  RotateCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Plus,
  Workflow,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Activity,
  Download,
  FileText,
  Power,
} from 'lucide-react'

const N8N_WORKFLOWS_URL = 'https://websiseo.app.n8n.cloud/workflows'
const LOCAL_MAPPING_KEY = 'n8n-dashboard.sheetMappings'

type WorkflowStatus = 'active' | 'paused' | 'error'
type StatusFilter = 'all' | WorkflowStatus | 'critical'

interface WorkflowItem {
  id: string
  name: string
  description: string
  status: WorkflowStatus
  lastRun: string
  runs: number
  category: string
  healthScore?: number | null
  riskScore?: number | null
  healthBand?: string | null
  successRate7d?: number | null
  openInN8nUrl?: string
}

interface FailedExecution {
  id: string
  workflowName: string
  startedAt: string | null
  durationMs: number | null
  openInN8nUrl?: string
}

interface SyncStatus {
  host: string
  apiStatus: string
  lastSyncAt: string | null
}

export function WorkflowsTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [failedExecutions, setFailedExecutions] = useState<FailedExecution[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [dataSource, setDataSource] = useState<'supabase' | 'live' | 'none'>('none')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [sheetMappings, setSheetMappings] = useState<Record<string, SheetMappingData>>({})
  const [selectedWorkflow, setSelectedWorkflow] = useState<{ id: string; name: string } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string; nextActive: boolean } | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const handleExport = async (id: string) => {
    try {
      const res = await authedFetch(`/api/n8n/workflow/${id}/export`)
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'export failed')
      await downloadResponse(res, `workflow-${id}.json`)
    } catch (e) {
      setNotice({ type: 'error', title: 'Export failed', message: e instanceof Error ? e.message : 'Could not export workflow.' })
    }
  }

  const handleDocs = async (id: string, name: string) => {
    try {
      const res = await authedFetch(`/api/n8n/workflow/${id}/docs`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.markdown) throw new Error(data?.error || 'docs failed')
      downloadText(data.markdown, `${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || id}.md`, 'text/markdown')
      setNotice({ type: 'success', title: 'Docs generated', message: 'Workflow documentation downloaded as Markdown.' })
    } catch (e) {
      setNotice({ type: 'error', title: 'Docs failed', message: e instanceof Error ? e.message : 'Could not generate docs.' })
    }
  }

  const confirmToggle = async (reason: string) => {
    if (!confirmTarget) return
    setConfirmBusy(true)
    try {
      const res = await authedFetch(`/api/n8n/workflow/${confirmTarget.id}/mutate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmTarget.nextActive ? 'activate' : 'deactivate', reason, confirm: true }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setNotice({ type: 'success', title: `Workflow ${confirmTarget.nextActive ? 'activated' : 'deactivated'}`, message: `${confirmTarget.name} is now ${data.active ? 'active' : 'paused'}.` })
        setConfirmTarget(null)
        await loadData()
      } else {
        setNotice({ type: 'error', title: 'Action blocked', message: data?.error || 'The mutation was not applied.' })
      }
    } finally {
      setConfirmBusy(false)
    }
  }

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

      // 1) Prefer synced portfolio (health/risk/history).
      const portfolio = await fetch('/api/n8n/portfolio', { headers }).then((r) => r.json()).catch(() => null)
      if (portfolio?.source === 'supabase' && Array.isArray(portfolio.workflows) && portfolio.workflows.length > 0) {
        setWorkflows(portfolio.workflows)
        setFailedExecutions(portfolio.failedExecutions || [])
        setSyncStatus(portfolio.syncStatus || null)
        setDataSource('supabase')
        return
      }

      // 2) Fall back to the live n8n route (no persistence yet).
      const live = await fetch('/api/n8n/workflows', { headers })
      if (live.ok) {
        const data = await live.json()
        setWorkflows(data.workflows || [])
        setSyncStatus(portfolio?.syncStatus || null)
        setDataSource('live')
        if ((data.workflows || []).length === 0) {
          setNotice({ type: 'info', title: 'No workflows yet', message: 'Connect an n8n API key and run a sync to populate the portfolio.' })
        }
      } else {
        const data = await live.json().catch(() => null)
        setDataSource('none')
        setNotice({ type: 'error', title: 'Workflow data unavailable', message: data?.error || 'Sign in again or run a sync.' })
      }
    } catch (error) {
      console.error('Failed to load workflows:', error)
      setNotice({ type: 'error', title: 'Workflow data unavailable', message: 'The dashboard could not reach the workflow API. Try refreshing the page.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const localMappings = JSON.parse(localStorage.getItem(LOCAL_MAPPING_KEY) || '{}')
    if (Object.keys(localMappings).length > 0) {
      setSheetMappings((prev) => ({ ...prev, ...localMappings }))
    }
  }, [])

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/n8n/sync', {
        method: 'POST',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const summary = await res.json().catch(() => null)
      if (res.ok && summary?.ok) {
        setNotice({ type: 'success', title: 'Sync complete', message: `${summary.workflows} workflows, ${summary.executions} executions (${summary.failedExecutions} failed) from ${summary.instance?.host}.` })
        await loadData()
      } else {
        setNotice({ type: 'error', title: 'Sync failed', message: summary?.error || 'The n8n sync did not complete. Check the API key configuration.' })
      }
    } catch {
      setNotice({ type: 'error', title: 'Sync failed', message: 'Could not reach the sync endpoint.' })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSaveMapping = (mapping: SheetMapping) => {
    setSheetMappings((prev) => ({ ...prev, [mapping.workflow_id]: { sheet_url: mapping.sheet_url, sheet_name: mapping.sheet_name } }))
    setNotice({ type: 'success', title: 'Sheet mapping saved', message: 'The mapping is available in this browser.' })
  }

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'critical'
          ? w.healthBand === 'Critical' || w.healthBand === 'Risky'
          : w.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'paused': return <Pause className="w-4 h-4 text-yellow-400" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = { active: 'success', paused: 'warning', error: 'danger' } as const
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>
  }

  const getHealthBadge = (band?: string | null, score?: number | null) => {
    if (!band) return null
    const variant = band === 'Excellent' || band === 'Healthy' ? 'success' : band === 'Needs improvement' ? 'warning' : 'danger'
    return <Badge variant={variant}>Health {typeof score === 'number' ? score : '—'} · {band}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  const statusFilters: StatusFilter[] = ['all', 'active', 'paused', 'error', 'critical']

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Workflow className="w-6 h-6 text-blue-500" />
            Workflow Portfolio
          </h1>
          <p className="text-slate-400 mt-1">Monitor, score, and debug your n8n automation pipelines</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-200"
            onClick={handleSync}
            disabled={isSyncing}
            title="Sync workflows and executions from n8n"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {isSyncing ? 'Syncing…' : 'Sync now'}
          </Button>
          <a
            href={N8N_WORKFLOWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </a>
        </div>
      </div>

      {/* Sync status card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">Source:</span>
            <span className="text-white font-medium">{dataSource === 'supabase' ? 'Synced (Supabase)' : dataSource === 'live' ? 'Live n8n (unsynced)' : 'Unavailable'}</span>
          </div>
          {syncStatus && (
            <>
              <div><span className="text-slate-400">Instance:</span> <span className="text-white">{syncStatus.host}</span></div>
              <div><span className="text-slate-400">API:</span> <span className={syncStatus.apiStatus === 'reachable' ? 'text-green-400' : 'text-red-400'}>{syncStatus.apiStatus}</span></div>
              <div><span className="text-slate-400">Last sync:</span> <span className="text-white">{syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleString() : 'Never'}</span></div>
            </>
          )}
          {dataSource === 'live' && (
            <span className="text-yellow-400">Run a sync to enable health scores, history, and the error center.</span>
          )}
        </CardContent>
      </Card>

      {notice && (
        <ActionNotice type={notice.type} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />
      )}

      {/* Search + filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {f === 'all' ? `All (${workflows.length})` : f === 'critical' ? 'At risk' : `${f} (${workflows.filter((w) => w.status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Failed executions panel */}
      {failedExecutions.length > 0 && (
        <Card className="bg-slate-900 border-red-900/40">
          <CardContent className="p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-300 mb-3">
              <ShieldAlert className="w-4 h-4" /> Recent failed executions ({failedExecutions.length})
            </h2>
            <div className="space-y-2">
              {failedExecutions.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-200 truncate">{e.workflowName}</span>
                  <span className="text-slate-500 shrink-0">{e.startedAt ? new Date(e.startedAt).toLocaleString() : '—'}</span>
                  {e.openInN8nUrl && (
                    <a href={e.openInN8nUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 shrink-0" title="Open execution in n8n">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow rows */}
      <div className="grid gap-4">
        {filteredWorkflows.map((workflow) => {
          const openUrl = workflow.openInN8nUrl || `https://websiseo.app.n8n.cloud/workflow/${workflow.id}`
          return (
            <Card key={workflow.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      {getStatusIcon(workflow.status)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white break-words [overflow-wrap:anywhere]">{workflow.name}</h3>
                        {getStatusBadge(workflow.status)}
                        {getHealthBadge(workflow.healthBand, workflow.healthScore)}
                        <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">{workflow.category}</Badge>
                        <SheetLinkButton
                          workflowId={workflow.id.toString()}
                          mapping={sheetMappings[workflow.id]}
                          onClick={() => {
                            setSelectedWorkflow({ id: workflow.id.toString(), name: workflow.name })
                            setIsModalOpen(true)
                          }}
                        />
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5 break-words [overflow-wrap:anywhere]">{workflow.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 sm:gap-4">
                    <div>
                      <p className="text-white font-medium">{workflow.runs.toLocaleString()}</p>
                      <p>runs</p>
                    </div>
                    {typeof workflow.successRate7d === 'number' && (
                      <div>
                        <p className="text-white font-medium">{Math.round(workflow.successRate7d * 100)}%</p>
                        <p>7d success</p>
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{workflow.lastRun}</p>
                      <p>last run</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <a
                        href={openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md h-9 w-9 text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-colors"
                        title="Open in n8n"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        title="Execution is gated in n8n"
                        aria-label={`Execute ${workflow.name} in n8n`}
                        onClick={() => setNotice({ type: 'warning', title: 'Execution is gated in n8n', message: 'Open the workflow in n8n and execute it there so credentials and logs stay controlled.' })}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        title="Refresh from n8n"
                        aria-label={`Refresh ${workflow.name}`}
                        onClick={handleSync}
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        title="Export workflow JSON"
                        aria-label={`Export ${workflow.name}`}
                        onClick={() => handleExport(workflow.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        title="Generate documentation"
                        aria-label={`Generate docs for ${workflow.name}`}
                        onClick={() => handleDocs(workflow.id, workflow.name)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={workflow.status === 'paused' ? 'text-slate-400 hover:text-green-400' : 'text-slate-400 hover:text-red-400'}
                        title={workflow.status === 'paused' ? 'Activate workflow (gated)' : 'Deactivate workflow (gated)'}
                        aria-label={`${workflow.status === 'paused' ? 'Activate' : 'Deactivate'} ${workflow.name}`}
                        onClick={() => setConfirmTarget({ id: workflow.id, name: workflow.name, nextActive: workflow.status === 'paused' })}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filteredWorkflows.length === 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center text-slate-400">
              No workflows match the current filter.
            </CardContent>
          </Card>
        )}
      </div>

      <SheetMappingModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedWorkflow(null) }}
        workflowId={selectedWorkflow?.id || ''}
        workflowName={selectedWorkflow?.name || ''}
        existingMapping={selectedWorkflow && sheetMappings[selectedWorkflow.id] ? { workflow_id: selectedWorkflow.id, ...sheetMappings[selectedWorkflow.id] } : undefined}
        onSave={handleSaveMapping}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.nextActive ? 'Activate workflow?' : 'Deactivate workflow?'}
        message={`This changes the LIVE state of "${confirmTarget?.name}" in production n8n. A reason is required and the action is audited.`}
        confirmLabel={confirmTarget?.nextActive ? 'Activate' : 'Deactivate'}
        requireReason
        busy={confirmBusy}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmToggle}
      />
    </div>
  )
}
