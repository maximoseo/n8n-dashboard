'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'

const workflows = [
  {
    id: 1,
    name: 'URL Screenshot Pipeline',
    description: 'Captures responsive screenshots via Browserless with fallback providers',
    status: 'active',
    lastRun: '2 min ago',
    runs: 1247,
    category: 'URLs',
  },
  {
    id: 2,
    name: 'Parent ID Scanner',
    description: 'WordPress site scanning with credential validation and writeback',
    status: 'active',
    lastRun: '15 min ago',
    runs: 892,
    category: 'WordPress',
  },
  {
    id: 3,
    name: 'SERP Keyword Research',
    description: 'SERP analysis, competitor discovery and validation agents',
    status: 'paused',
    lastRun: '1 hour ago',
    runs: 456,
    category: 'Research',
  },
  {
    id: 4,
    name: 'Cannibalization Checker',
    description: 'Overlap analysis and keyword conflict detection',
    status: 'active',
    lastRun: '30 min ago',
    runs: 234,
    category: 'Analysis',
  },
  {
    id: 5,
    name: 'Content Brief Generator',
    description: 'AI synthesis and workbook generation for content teams',
    status: 'active',
    lastRun: '5 min ago',
    runs: 678,
    category: 'Content',
  },
  {
    id: 6,
    name: 'Link Building Scorer',
    description: 'Quality scoring and Google policy risk assessment',
    status: 'error',
    lastRun: '3 hours ago',
    runs: 123,
    category: 'Links',
  },
]

export function WorkflowsTab() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWorkflows = workflows.filter(
    (w) =>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Workflow className="w-6 h-6 text-blue-500" />
            Workflows
          </h1>
          <p className="text-slate-400 mt-1">Manage and monitor your n8n automation pipelines</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-white"
          />
        </div>
        <div className="flex gap-2">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    {getStatusIcon(workflow.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{workflow.name}</h3>
                      {getStatusBadge(workflow.status)}
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                        {workflow.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">{workflow.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="text-right">
                    <p className="text-white font-medium">{workflow.runs.toLocaleString()}</p>
                    <p>total runs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{workflow.lastRun}</p>
                    <p>last run</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
