'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ActionNotice } from '@/components/action-notice'
import { authedFetch } from '@/lib/client-fetch'
import { Loader2, LayoutTemplate, Sparkles, Download, Save } from 'lucide-react'

interface Template {
  id: string
  name: string
  category: string
  description?: string
  required_credentials?: string[]
  install_mode: string
  origin: string
  status: string
  source_workflow_id?: string | null
}

export function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [importId, setImportId] = useState('')
  const [importing, setImporting] = useState(false)
  const [goal, setGoal] = useState('')
  const [spec, setSpec] = useState<string>('')
  const [building, setBuilding] = useState(false)
  const [savingSpec, setSavingSpec] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('/api/n8n/templates')
      const data = await res.json().catch(() => null)
      setTemplates(data?.templates || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const importWorkflow = async () => {
    if (!importId.trim()) return
    setImporting(true)
    try {
      const res = await authedFetch('/api/n8n/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workflowId: importId.trim() }) })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) { setNotice({ type: 'success', title: 'Imported', message: 'Workflow saved as a template (redacted).' }); setImportId(''); await load() }
      else setNotice({ type: 'error', title: 'Import failed', message: data?.error || 'Could not import workflow.' })
    } finally { setImporting(false) }
  }

  const buildSpec = async () => {
    if (goal.trim().length < 8) return
    setBuilding(true); setSpec('')
    try {
      const res = await authedFetch('/api/ai/builder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: goal.trim() }) })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) setSpec(data.spec || '')
      else setNotice({ type: 'info', title: 'AI Builder unavailable', message: data?.error || 'Configure an AI provider key to use the builder.' })
    } finally { setBuilding(false) }
  }

  const saveSpec = async () => {
    if (!spec) return
    setSavingSpec(true)
    try {
      const name = `AI: ${goal.trim().slice(0, 48)}`
      const res = await authedFetch('/api/n8n/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: spec, origin: 'ai_builder', install_mode: 'guide_only', category: 'ai-draft' }) })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) { setNotice({ type: 'success', title: 'Saved', message: 'AI spec saved as a draft template for review.' }); await load() }
      else setNotice({ type: 'error', title: 'Save failed', message: data?.error || 'Could not save template.' })
    } finally { setSavingSpec(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><LayoutTemplate className="w-6 h-6 text-blue-500" /> Template Library &amp; AI Builder</h1>
        <p className="text-slate-400 mt-1">Reusable automations and AI-generated specs (drafts only — never auto-activated)</p>
      </div>

      {notice && <ActionNotice type={notice.type} title={notice.title} message={notice.message} onDismiss={() => setNotice(null)} />}

      {/* AI Builder */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-400" /> AI Builder</h2>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe an automation goal, e.g. 'Weekly DataForSEO keyword check for active client sites, summarize with Claude, create tasks, Telegram alert.'"
            className="w-full min-h-24 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div className="flex gap-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={buildSpec} disabled={building || goal.trim().length < 8}>
              {building ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Generate spec
            </Button>
            {spec && (
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-200" onClick={saveSpec} disabled={savingSpec}>
                {savingSpec ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save as draft
              </Button>
            )}
          </div>
          {spec && <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-slate-300 max-h-96 overflow-auto">{spec}</pre>}
        </CardContent>
      </Card>

      {/* Import */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Download className="w-4 h-4 text-blue-400" /> Import workflow as template</h2>
          <div className="flex gap-2">
            <Input value={importId} onChange={(e) => setImportId(e.target.value)} placeholder="n8n workflow ID" className="bg-slate-950 border-slate-700 text-white max-w-xs" />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={importWorkflow} disabled={importing || !importId.trim()}>
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Import
            </Button>
          </div>
          <p className="text-xs text-slate-500">The workflow JSON is fetched and redacted before storage.</p>
        </CardContent>
      </Card>

      {/* Templates list */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
      ) : templates.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800"><CardContent className="p-8 text-center text-slate-400">No templates yet. Import a workflow or save an AI spec.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white truncate">{t.name}</h3>
                  <Badge variant={t.origin === 'ai_builder' ? 'secondary' : 'outline'}>{t.origin === 'ai_builder' ? 'AI draft' : t.install_mode}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{t.category} · {t.status}</p>
                {t.description && <p className="text-sm text-slate-400 mt-2 line-clamp-3 whitespace-pre-wrap">{t.description.slice(0, 240)}</p>}
                {t.required_credentials && t.required_credentials.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">Credentials: {t.required_credentials.join(', ')}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
