'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'

const integrations = [
  { id: 1, name: 'n8n API', status: 'connected', lastSync: '2 min ago', icon: Webhook },
  { id: 2, name: 'Browserless', status: 'connected', lastSync: '5 min ago', icon: ExternalLink },
  { id: 3, name: 'Google Sheets', status: 'connected', lastSync: '1 hour ago', icon: FileJson },
  { id: 4, name: 'Firecrawl', status: 'error', lastSync: '3 hours ago', icon: Database },
  { id: 5, name: 'OpenAI API', status: 'connected', lastSync: 'just now', icon: Key },
]

const settings = [
  { category: 'API Keys', items: ['n8n Webhook URL', 'Browserless Token', 'OpenAI API Key', 'Firecrawl Key'] },
  { category: 'Notifications', items: ['Email Alerts', 'Slack Webhook', 'Daily Digest', 'Error Notifications'] },
  { category: 'Privacy', items: ['Data Retention', 'Export Data', 'Delete History', 'Access Logs'] },
]

export function SeoToolsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" />
          SEO Tools & Settings
        </h1>
        <p className="text-slate-400 mt-1">Configure integrations, API keys, and tool preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Integrations
            </CardTitle>
            <CardDescription className="text-slate-400">Connected services and their status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((integration) => {
              const Icon = integration.icon
              return (
                <div key={integration.id} className="flex flex-col gap-3 p-3 bg-slate-800 rounded-lg sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white break-words">{integration.name}</p>
                      <p className="text-xs text-slate-400">Last sync: {integration.lastSync}</p>
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
                        Error
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" className="text-slate-400 h-8 w-8 p-0">
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
                    <div key={item} className="flex flex-col gap-2 p-2 hover:bg-slate-800 rounded-lg cursor-pointer sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-slate-400 break-words">{item}</span>
                      <Badge variant="outline" className="border-slate-700 text-slate-500 text-xs">
                        Configure
                      </Badge>
                    </div>
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
