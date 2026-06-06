'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActionNotice } from '@/components/action-notice'
import { supabase } from '@/lib/supabase'
import {
  Settings,
  Key,
  Shield,
  Database,
  Webhook,
  FileJson,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bot,
} from 'lucide-react'

const settings = [
  { category: 'API Keys', items: ['n8n API', 'Browserless Token', 'OpenAI API Key', 'Firecrawl Key'] },
  { category: 'Notifications', items: ['Email Alerts', 'Daily Digest', 'Error Notifications'] },
  { category: 'Privacy', items: ['Data Retention', 'Export Data', 'Access Logs'] },
]

interface IntegrationStatus {
  name: string
  status: 'connected' | 'not_connected'
  detail: string
  checkedAt?: string
  icon: typeof Webhook
}

export function SeoToolsTab() {
  const [notice, setNotice] = useState<{title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error'} | null>(null)
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStatuses() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch('/api/integrations/status', {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.error || 'Integration status unavailable')

        const iconByName: Record<string, IntegrationStatus['icon']> = {
          'n8n API': Webhook,
          Browserless: ExternalLink,
          Firecrawl: Database,
          'Google Sheets': FileJson,
          'OpenAI API': Key,
          'Agent Task Bridge': Bot,
        }
        setIntegrations((data?.integrations || []).map((integration: Omit<IntegrationStatus, 'icon'>) => ({
          ...integration,
          icon: iconByName[integration.name] || Key,
        })))
      } catch (error) {
        setIntegrations([
          {
            name: 'Integration status',
            status: 'not_connected',
            detail: error instanceof Error ? error.message : 'Unavailable',
            icon: AlertCircle,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadStatuses()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" />
          SEO Tools & Settings
        </h1>
        <p className="text-slate-400 mt-1">Configure integrations, API keys, and tool preferences</p>
      </div>

      {notice && (
        <ActionNotice
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Integrations
            </CardTitle>
            <CardDescription className="text-slate-400">Connected services and their live status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="p-3 text-sm text-slate-400">Checking integrations...</div>
            ) : integrations.map((integration) => {
              const Icon = integration.icon
              return (
                <div key={integration.name} className="flex flex-col gap-3 p-3 bg-slate-800 rounded-lg sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white break-words">{integration.name}</p>
                      <p className="text-xs text-slate-400">{integration.detail}</p>
                      {integration.checkedAt && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Checked {new Date(integration.checkedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {integration.status === 'connected' ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Not connected
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 h-8 w-8 p-0"
                      aria-label={`Refresh ${integration.name}`}
                      title={`Refresh ${integration.name}`}
                      onClick={() => setNotice({
                        type: integration.status === 'connected' ? 'success' : 'warning',
                        title: `${integration.name} status`,
                        message: integration.detail,
                      })}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-500" />
              API Configuration
            </CardTitle>
            <CardDescription className="text-slate-400">Manage API keys and credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.map((section) => (
              <div key={section.category}>
                <h4 className="text-sm font-medium text-slate-300 mb-2">{section.category}</h4>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="flex w-full flex-col gap-2 rounded-lg p-2 text-left hover:bg-slate-800 sm:flex-row sm:items-center sm:justify-between"
                      onClick={() => setNotice({
                        type: 'warning',
                        title: `${item} is server-managed`,
                        message: 'Credential changes must be made in Render/Supabase/Paperclip server configuration. This browser UI does not expose or edit secrets.',
                      })}
                    >
                      <span className="text-sm text-slate-400 break-words">{item}</span>
                      <Badge variant="outline" className="border-slate-700 text-slate-500 text-xs">
                        Server env
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Security & Compliance
          </CardTitle>
          <CardDescription className="text-slate-400">Google-compliant link building defaults</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800 rounded-lg min-w-0">
              <Badge variant="outline" className="border-slate-700 text-slate-400 mb-2 max-w-full whitespace-normal break-all">rel=sponsored</Badge>
              <p className="text-sm text-slate-400">Required for paid or sponsored placements</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg min-w-0">
              <Badge variant="outline" className="border-slate-700 text-slate-400 mb-2 max-w-full whitespace-normal break-all">rel=ugc</Badge>
              <p className="text-sm text-slate-400">Required for user-generated content links</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg min-w-0">
              <Badge variant="outline" className="border-slate-700 text-slate-400 mb-2 max-w-full whitespace-normal break-all">rel=nofollow</Badge>
              <p className="text-sm text-slate-400">Use when link value should not be passed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
