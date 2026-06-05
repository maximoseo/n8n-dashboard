'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Globe,
  Camera,
  ExternalLink,
  FileSpreadsheet,
  Scan,
  Download,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Monitor,
  Plus,
} from 'lucide-react'

const sites = [
  { id: 1, name: 'maximo-seo.ai', url: 'https://maximo-seo.ai', status: 'connected', lastScan: '2 hours ago' },
  { id: 2, name: 'blog.example.com', url: 'https://blog.example.com', status: 'connected', lastScan: '1 day ago' },
  { id: 3, name: 'client-site.com', url: 'https://client-site.com', status: 'error', lastScan: '3 days ago' },
]

const recentScreenshots = [
  { id: 1, url: 'https://example.com/page1', device: 'desktop', status: 'completed', date: '10 min ago' },
  { id: 2, url: 'https://example.com/page2', device: 'mobile', status: 'completed', date: '15 min ago' },
  { id: 3, url: 'https://example.com/page3', device: 'desktop', status: 'processing', date: 'just now' },
]

export function UrlsTab() {
  const [activeSubTab, setActiveSubTab] = useState('screenshots')
  const [urlInput, setUrlInput] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" />
            URLs Previewer
          </h1>
          <p className="text-slate-400 mt-1">Responsive screenshots, WordPress sites, and Parent ID scans</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Full Tool
        </Button>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
          <TabsTrigger value="sites">WordPress Sites</TabsTrigger>
          <TabsTrigger value="writeback">Sheet Writeback</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeSubTab === 'screenshots' && (
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" />
                Batch Screenshot Intake
              </CardTitle>
              <CardDescription className="text-slate-400">
                Paste URLs to prepare the screenshot/QA batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <div className="flex items-center gap-3">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Screenshots
                  </Button>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                      <Monitor className="w-3 h-3 mr-1" />
                      Desktop
                    </Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                      <Smartphone className="w-3 h-3 mr-1" />
                      Mobile
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-white">Recent Captures</h3>
            {recentScreenshots.map((screenshot) => (
              <Card key={screenshot.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 bg-slate-800 rounded border border-slate-700 flex items-center justify-center">
                        {screenshot.device === 'mobile' ? (
                          <Smartphone className="w-6 h-6 text-slate-500" />
                        ) : (
                          <Monitor className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{screenshot.url}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                            {screenshot.device}
                          </Badge>
                          <span className="text-sm text-slate-500">{screenshot.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {screenshot.status === 'completed' ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="warning">Processing</Badge>
                      )}
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'sites' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Scan className="w-5 h-5 text-blue-500" />
              Saved WordPress Sites
            </h3>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          </div>
          {sites.map((site) => (
            <Card key={site.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{site.name}</p>
                      <p className="text-sm text-slate-400">{site.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Last scan</p>
                      <p className="text-white font-medium">{site.lastScan}</p>
                    </div>
                    {site.status === 'connected' ? (
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeSubTab === 'writeback' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              Google Sheets Writeback
            </CardTitle>
            <CardDescription className="text-slate-400">
              Preview and confirm data before writing to sheets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Connected Spreadsheet</p>
                <p className="text-white font-medium">n8n-Workflow-Data / URL-Scans</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-slate-700 text-slate-300">
                  Preview Mapping
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Confirm & Write
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
