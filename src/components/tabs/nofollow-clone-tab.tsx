'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ActionNotice } from '@/components/action-notice'
import { supabase } from '@/lib/supabase'
import {
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Workflow,
} from 'lucide-react'

interface Template {
  id: string
  name: string
  active: boolean
  updatedAt?: string | null
  tags: string[]
}

interface CloneResult {
  workflow: {
    id: string
    name: string
    active: boolean
    url: string
  }
  sheet: {
    spreadsheetId: string
    spreadsheetUrl: string
    createdBy: string
  }
}

const emptyForm = {
  sourceWorkflowId: '',
  sourceDomain: '',
  siteName: '',
  siteUrl: '',
  keyword: '',
  location: '',
  sheetTitle: '',
  activate: false,
}

export function NofollowCloneTab() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [form, setForm] = useState(emptyForm)
  const [notice, setNotice] = useState<{title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error'} | null>(null)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<CloneResult | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }

  async function loadTemplates() {
    setIsLoadingTemplates(true)
    try {
      const response = await fetch('/api/nofollow/templates', {
        headers: await getAuthHeaders(),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load Nofollow templates')
      }

      setTemplates(data.templates || [])
      if (!form.sourceWorkflowId && data.templates?.[0]?.id) {
        setForm((current) => ({ ...current, sourceWorkflowId: data.templates[0].id }))
      }
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Nofollow templates unavailable',
        message: error instanceof Error ? error.message : 'Could not load live n8n workflows.',
      })
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  async function submitClone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setResult(null)
    setNotice(null)

    try {
      const response = await fetch('/api/nofollow/clone', {
        method: 'POST',
        headers: {
          ...(await getAuthHeaders()),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Clone failed')
      }

      setResult(data)
      setNotice({
        type: 'success',
        title: 'Nofollow account cloned',
        message: 'A live n8n workflow and Google Sheet were created from the selected source.',
      })
      setForm((current) => ({ ...current, siteName: '', siteUrl: '', keyword: '', location: '', sheetTitle: '' }))
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Clone failed',
        message: error instanceof Error ? error.message : 'The server could not create the Nofollow clone.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedTemplate = templates.find((template) => template.id === form.sourceWorkflowId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Copy className="w-6 h-6 text-blue-500" />
            Nofollow Clone
          </h1>
          <p className="text-slate-400 mt-1">Clone an existing Nofollow workflow into a new site account with a fresh Google Sheet</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-slate-700 text-slate-300"
          onClick={loadTemplates}
          disabled={isLoadingTemplates}
        >
          {isLoadingTemplates ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh Templates
        </Button>
      </div>

      {notice && (
        <ActionNotice
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Workflow className="w-5 h-5 text-blue-500" />
              New Site Setup
            </CardTitle>
            <CardDescription className="text-slate-400">
              The server creates the Sheet first, then clones the selected live n8n workflow with the new site, keyword, prompts, and Sheet ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submitClone}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sourceWorkflowId" className="text-slate-300">Source Nofollow workflow</Label>
                  <select
                    id="sourceWorkflowId"
                    value={form.sourceWorkflowId}
                    onChange={(event) => setForm((current) => ({ ...current, sourceWorkflowId: event.target.value }))}
                    className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  >
                    <option value="">Select live Nofollow workflow...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                  {selectedTemplate && (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <Badge variant={selectedTemplate.active ? 'success' : 'secondary'}>
                        {selectedTemplate.active ? 'Active source' : 'Paused source'}
                      </Badge>
                      <span className="break-all">ID: {selectedTemplate.id}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-slate-300">New site name</Label>
                  <Input
                    id="siteName"
                    value={form.siteName}
                    onChange={(event) => setForm((current) => ({ ...current, siteName: event.target.value }))}
                    placeholder="Galoz"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteUrl" className="text-slate-300">New site URL</Label>
                  <Input
                    id="siteUrl"
                    value={form.siteUrl}
                    onChange={(event) => setForm((current) => ({ ...current, siteUrl: event.target.value }))}
                    placeholder="https://www.example.co.il"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword" className="text-slate-300">Primary keyword</Label>
                  <Input
                    id="keyword"
                    value={form.keyword}
                    onChange={(event) => setForm((current) => ({ ...current, keyword: event.target.value }))}
                    placeholder="industrial control equipment"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-300">Location or market</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Israel"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceDomain" className="text-slate-300">Source domain to replace</Label>
                  <Input
                    id="sourceDomain"
                    value={form.sourceDomain}
                    onChange={(event) => setForm((current) => ({ ...current, sourceDomain: event.target.value }))}
                    placeholder="old-site.co.il"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sheetTitle" className="text-slate-300">Google Sheet title</Label>
                  <Input
                    id="sheetTitle"
                    value={form.sheetTitle}
                    onChange={(event) => setForm((current) => ({ ...current, sheetTitle: event.target.value }))}
                    placeholder="Auto-generated if empty"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                <input
                  type="checkbox"
                  checked={form.activate}
                  onChange={(event) => setForm((current) => ({ ...current, activate: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800"
                />
                <span>
                  <span className="block text-sm font-medium text-white">Activate cloned workflow immediately</span>
                  <span className="block text-xs text-slate-400">Leave off for safer QA before the first production run.</span>
                </span>
              </label>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting || !form.sourceWorkflowId}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                Create Nofollow Clone
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Live Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-blue-500" />
                n8n workflow is created through the account API.
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                Google Sheet is created before workflow cloning.
              </div>
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-500" />
                Keyword prompts are seeded into the Sheet and clone metadata.
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Created Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href={result.workflow.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-800 p-3 text-sm text-slate-200 hover:bg-slate-700"
                >
                  <span className="min-w-0 break-words">{result.workflow.name}</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
                <a
                  href={result.sheet.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-800 p-3 text-sm text-slate-200 hover:bg-slate-700"
                >
                  <span className="min-w-0 break-words">Google Sheet</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
                <Badge variant="outline" className="border-slate-700 text-slate-400">
                  Sheet via {result.sheet.createdBy}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
