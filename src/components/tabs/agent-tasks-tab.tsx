'use client'

import { useState } from 'react'
import { Bot, CheckCircle, Code2, Loader2, Send, Sparkles, Terminal, Users } from 'lucide-react'
import { ActionNotice } from '@/components/action-notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { CODING_AGENTS, type AgentTaskPriority, type CodingAgentId } from '@/lib/agent-tasks'

const iconByAgent: Record<CodingAgentId, typeof Bot> = {
  'openclaw64-claude': Sparkles,
  'openclaw64-codex': Code2,
  'openclaw64-opencode': Terminal,
  'openclaw64-openclaw': Bot,
  'openclaw64-kiro': Users,
}

export function AgentTasksTab() {
  const [title, setTitle] = useState('')
  const [brief, setBrief] = useState('')
  const [priority, setPriority] = useState<AgentTaskPriority>('normal')
  const [selectedAgents, setSelectedAgents] = useState<CodingAgentId[]>(['openclaw64-codex'])
  const [repoPath, setRepoPath] = useState('/root/work/n8n-dashboard')
  const [productionUrl, setProductionUrl] = useState('https://n8n-dashboard-v3.onrender.com')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastTask, setLastTask] = useState<{ taskId: string; status: string; agents: string[] } | null>(null)
  const [notice, setNotice] = useState<{title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error'} | null>(null)

  const toggleAgent = (agentId: CodingAgentId) => {
    setSelectedAgents((current) => (
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId]
    ))
  }

  const submitTask = async () => {
    setIsSubmitting(true)
    setNotice(null)
    setLastTask(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/agent-tasks/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          title,
          brief,
          priority,
          agents: selectedAgents,
          repoPath,
          productionUrl,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.detail || data?.error || 'Agent task submission failed')

      setLastTask({
        taskId: data.taskId,
        status: data.status,
        agents: (data.agents || []).map((agent: { name?: string }) => agent.name).filter(Boolean),
      })
      setNotice({
        type: 'success',
        title: 'Agent task submitted',
        message: `Task ${data.taskId} was accepted by the live agent bridge.`,
      })
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Agent task was not submitted',
        message: error instanceof Error ? error.message : 'The live agent bridge rejected the request.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Bot className="h-6 w-6 text-blue-500" />
            Agent Tasks
          </h1>
          <p className="mt-1 max-w-3xl text-slate-400">
            Send a real task to one or more coding CLI agents through the server-side agent bridge
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            Multi-agent
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            Server-side
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            No fake success
          </Badge>
        </div>
      </div>

      {notice && (
        <ActionNotice
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Task Brief</CardTitle>
            <CardDescription className="text-slate-400">
              Keep it concrete: goal, repo, constraints, verification, and what done means
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agentTaskTitle" className="text-slate-300">Title</Label>
                <Input
                  id="agentTaskTitle"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Improve mobile dashboard QA"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentTaskPriority" className="text-slate-300">Priority</Label>
                <select
                  id="agentTaskPriority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as AgentTaskPriority)}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agentRepoPath" className="text-slate-300">Repo / workspace</Label>
                <Input
                  id="agentRepoPath"
                  value={repoPath}
                  onChange={(event) => setRepoPath(event.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentProductionUrl" className="text-slate-300">Production URL</Label>
                <Input
                  id="agentProductionUrl"
                  value={productionUrl}
                  onChange={(event) => setProductionUrl(event.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentTaskBrief" className="text-slate-300">Brief</Label>
              <textarea
                id="agentTaskBrief"
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder="Describe exactly what the agents should do, what they must not touch, and how they should verify the result."
                className="min-h-44 w-full resize-y rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Choose Agents</CardTitle>
              <CardDescription className="text-slate-400">Select one or many agents for the same task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {CODING_AGENTS.map((agent) => {
                const Icon = iconByAgent[agent.id]
                const isSelected = selectedAgents.includes(agent.id)
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => toggleAgent(agent.id)}
                    className={`flex min-h-16 w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500/60 bg-blue-500/10'
                        : 'border-slate-800 bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-white">{agent.name}</span>
                      <span className="block text-xs text-slate-400">{agent.role}</span>
                    </span>
                    {isSelected && <CheckCircle className="h-5 w-5 shrink-0 text-blue-400" />}
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {lastTask && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Last Submission</CardTitle>
                <CardDescription className="text-slate-400">Accepted by the live bridge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg bg-slate-800 p-3">
                  <p className="text-slate-400">Task ID</p>
                  <p className="break-all font-medium text-white">{lastTask.taskId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">{lastTask.status}</Badge>
                  {lastTask.agents.map((agent) => (
                    <Badge key={agent} variant="outline" className="border-slate-700 text-slate-400">
                      {agent}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400">
          <span className="font-medium text-white">{selectedAgents.length}</span>
          {' '}
          {selectedAgents.length === 1 ? 'agent selected' : 'agents selected'}
          <span className="mx-2 text-slate-600">/</span>
          Brief must be at least 20 characters
        </div>
        <Button
          className="min-h-11 w-full bg-blue-600 text-white hover:bg-blue-700 disabled:text-white/70 sm:w-auto"
          onClick={submitTask}
          disabled={isSubmitting || !title.trim() || brief.trim().length < 20 || selectedAgents.length === 0}
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Submit to Agents</>
          )}
        </Button>
      </div>
    </div>
  )
}
