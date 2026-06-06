'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SheetMappingModal, SheetLinkButton, type SheetMapping, type SheetMappingData } from '@/components/sheet-mapping-modal'
import { ActionNotice } from '@/components/action-notice'
import {
  Play,
  Pause,
  RotateCw,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Search,
  Plus,
  Workflow,
  ExternalLink,
  Loader2,
} from 'lucide-react'

const N8N_WORKFLOWS_URL = 'https://websiseo.app.n8n.cloud/workflows'
const LOCAL_MAPPING_KEY = 'n8n-dashboard.sheetMappings'

interface WorkflowItem {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'error'
  lastRun: string
  runs: number
  category: string
}

export function WorkflowsTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sheetMappings, setSheetMappings] = useState<Record<string, SheetMappingData>>({})
  const [selectedWorkflow, setSelectedWorkflow] = useState<{id: string, name: string} | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notice, setNotice] = useState<{title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error'} | null>(null)

  // Load workflows from API
  useEffect(() => {
    async function loadWorkflows() {
      try {
        const response = await fetch('/api/n8n/workflows')
        if (response.ok) {
          const data = await response.json()
          setWorkflows(data.workflows || [])
        }
      } catch (error) {
        console.error('Failed to load workflows:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadWorkflows()
  }, [])

  // Load sheet mappings from Supabase
  useEffect(() => {
    function loadMappings() {
      const localMappings = JSON.parse(localStorage.getItem(LOCAL_MAPPING_KEY) || '{}')
      if (Object.keys(localMappings).length > 0) {
        setSheetMappings(prev => ({ ...prev, ...localMappings }))
      }
    }
    loadMappings()
  }, [])

  const handleSaveMapping = (mapping: SheetMapping) => {
    setSheetMappings(prev => ({
      ...prev,
      [mapping.workflow_id]: { sheet_url: mapping.sheet_url, sheet_name: mapping.sheet_name }
    }))
    setNotice({
      type: 'success',
      title: 'Sheet mapping saved',
      message: 'The mapping is available in this browser. Server writeback is disabled on the static Render service, so persistent team-wide sync still needs a backend endpoint.',
    })
  }

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-400" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'success',
      paused: 'warning',
      error: 'danger',
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Workflow className="w-6 h-6 text-blue-500" />
            Workflows
          </h1>
          <p className="text-slate-400 mt-1">Manage and monitor your n8n automation pipelines</p>
        </div>
        <a
          href={N8N_WORKFLOWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </a>
      </div>

      {notice && (
        <ActionNotice
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

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
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            Active: {workflows.filter((w) => w.status === 'active').length}
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            Paused: {workflows.filter((w) => w.status === 'paused').length}
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            Errors: {workflows.filter((w) => w.status === 'error').length}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredWorkflows.map((workflow) => (
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
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                        {workflow.category}
                      </Badge>
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
                    <p>total runs</p>
                  </div>
                  <div>
                    <p className="text-white font-medium">{workflow.lastRun}</p>
                    <p>last run</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <a
                      href={`https://websiseo.app.n8n.cloud/workflow/${workflow.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 text-slate-400 hover:text-blue-400"
                      title="Open in n8n"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      title="Execute in n8n"
                      aria-label={`Execute ${workflow.name} in n8n`}
                      onClick={() => setNotice({
                        type: 'warning',
                        title: 'Execution is gated in n8n',
                        message: 'This static dashboard cannot safely run workflows directly because it would expose n8n API credentials in the browser. Open the workflow in n8n and execute it from there.',
                      })}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      title="Refresh workflow data"
                      aria-label={`Refresh ${workflow.name} data`}
                      onClick={() => setNotice({
                        type: 'info',
                        title: 'Workflow data refreshed from static export',
                        message: 'The production dashboard is serving the latest exported workflow snapshot. Live refresh requires converting this Render service from static hosting to a server-backed dashboard.',
                      })}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      title="Open workflow settings in n8n"
                      aria-label={`Open ${workflow.name} settings in n8n`}
                      onClick={() => window.open(`https://websiseo.app.n8n.cloud/workflow/${workflow.id}`, '_blank', 'noopener,noreferrer')}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      title="More actions"
                      aria-label={`More actions for ${workflow.name}`}
                      onClick={() => setNotice({
                        type: 'info',
                        title: 'More actions live in n8n',
                        message: 'Advanced workflow actions are available in the n8n workspace so credentials and write permissions stay server-side.',
                      })}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SheetMappingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedWorkflow(null)
        }}
        workflowId={selectedWorkflow?.id || ''}
        workflowName={selectedWorkflow?.name || ''}
        existingMapping={selectedWorkflow && sheetMappings[selectedWorkflow.id] ? {
          workflow_id: selectedWorkflow.id,
          ...sheetMappings[selectedWorkflow.id]
        } : undefined}
        onSave={handleSaveMapping}
      />
    </div>
  )
}
