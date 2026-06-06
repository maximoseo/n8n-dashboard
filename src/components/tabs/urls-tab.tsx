'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActionNotice } from '@/components/action-notice'
import { supabase } from '@/lib/supabase'
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
  Loader2,
  FileText,
} from 'lucide-react'

const PAPERCLIP_URL = 'https://maximo-dashboard-company-paperclip.onrender.com/'

const sites = [
]

interface ScreenshotResult {
  url: string
  device: 'desktop' | 'mobile' | 'tablet'
  status: 'completed' | 'processing' | 'error'
  image?: string
  timestamp: string
  error?: string
}

interface ScrapedData {
  url: string
  markdown?: string
  html?: string
  title?: string
  timestamp: string
}

export function UrlsTab() {
  const [activeSubTab, setActiveSubTab] = useState('screenshots')
  const [urlInput, setUrlInput] = useState('')
  const [scrapeUrlInput, setScrapeUrlInput] = useState('')
  const [screenshots, setScreenshots] = useState<ScreenshotResult[]>([])
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'mobile' | 'tablet'>('desktop')
  const [notice, setNotice] = useState<{title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error'} | null>(null)

  const captureScreenshots = async () => {
    const urls = urlInput.split('\n').map((u) => u.trim()).filter(Boolean)
    if (urls.length === 0) return

    setIsCapturing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const results = await Promise.all(
        urls.slice(0, 10).map(async (url) => {
          try {
            const response = await fetch('/api/browserless/screenshot', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
              },
              body: JSON.stringify({ url, viewport: selectedDevice, fullPage: true }),
            })
            const data = await response.json().catch(() => null)
            if (!response.ok) throw new Error(data?.error || 'Screenshot failed')

            return {
              url: data.url || url,
              device: selectedDevice,
              status: 'completed' as const,
              image: data.image,
              timestamp: data.timestamp || new Date().toISOString(),
            }
          } catch (error) {
            return {
              url,
              device: selectedDevice,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Screenshot failed',
              timestamp: new Date().toISOString(),
            }
          }
        })
      )

      setScreenshots(prev => [...results, ...prev].slice(0, 20))
      setNotice({
        type: results.some((result) => result.status === 'completed') ? 'success' : 'error',
        title: 'Screenshot run finished',
        message: `${results.filter((result) => result.status === 'completed').length}/${results.length} screenshots completed from the live Browserless API.`,
      })
    } finally {
      setIsCapturing(false)
    }
  }

  const prepareScrape = async () => {
    if (!scrapeUrlInput.trim()) return

    setIsScraping(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/firecrawl/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ url: scrapeUrlInput.trim(), formats: ['markdown', 'html'] }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Firecrawl scrape failed')

      setScrapedData({
        url: data.url || scrapeUrlInput.trim(),
        title: data.data?.metadata?.title || 'Scraped Content',
        markdown: data.data?.markdown,
        html: data.data?.html,
        timestamp: data.timestamp || new Date().toISOString(),
      })
      setNotice({
        type: 'success',
        title: 'Firecrawl scrape completed',
        message: 'The page content was extracted from the live Firecrawl API.',
      })
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Firecrawl scrape failed',
        message: error instanceof Error ? error.message : 'The live scrape request failed.',
      })
    } finally {
      setIsScraping(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" />
            URLs Previewer
          </h1>
          <p className="text-slate-400 mt-1">Responsive screenshots, WordPress sites, and Parent ID scans</p>
        </div>
        <a
          href={PAPERCLIP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Full Tool
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
                Paste URLs to capture screenshots with the live Browserless API
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
                <div className="flex items-center gap-3 flex-wrap">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={captureScreenshots}
                    disabled={isCapturing || !urlInput.trim()}
                  >
                    {isCapturing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Capturing...</>
                    ) : (
                      <><Camera className="w-4 h-4 mr-2" /> Capture Screenshots</>
                    )}
                  </Button>
                  <div className="flex gap-2">
	                    <button 
	                      type="button"
	                      onClick={() => setSelectedDevice('desktop')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm border transition-colors ${selectedDevice === 'desktop' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      <Monitor className="w-3 h-3" />
                      Desktop
                    </button>
	                    <button 
	                      type="button"
	                      onClick={() => setSelectedDevice('mobile')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm border transition-colors ${selectedDevice === 'mobile' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      <Smartphone className="w-3 h-3" />
                      Mobile
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-white">Recent Captures ({screenshots.length})</h3>
            {screenshots.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No screenshots captured yet. Enter URLs above to start.</p>
            ) : (
              screenshots.map((screenshot, index) => (
                <Card key={index} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 bg-slate-800 rounded border border-slate-700 flex items-center justify-center overflow-hidden">
                          {screenshot.image ? (
                            <img src={screenshot.image} alt="Screenshot" className="w-full h-full object-cover" />
                          ) : screenshot.device === 'mobile' ? (
                            <Smartphone className="w-6 h-6 text-slate-500" />
                          ) : (
                            <Monitor className="w-6 h-6 text-slate-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{screenshot.url}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                              {screenshot.device}
                            </Badge>
                            <span className="text-sm text-slate-500">{new Date(screenshot.timestamp).toLocaleTimeString()}</span>
                          </div>
                          {screenshot.error && (
                            <p className="text-xs text-red-400 mt-1">{screenshot.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {screenshot.status === 'completed' ? (
                          <Badge variant="success">Done</Badge>
                        ) : screenshot.status === 'error' ? (
                          <Badge variant="danger">Error</Badge>
                        ) : (
	                          <Badge variant="warning"><Loader2 className="w-3 h-3 animate-spin mr-1" />…</Badge>
                        )}
                        {screenshot.image && (
                          <Button variant="ghost" size="sm" className="text-slate-400" onClick={() => {
                            const a = document.createElement('a')
                            a.href = screenshot.image!
                            a.download = `screenshot-${screenshot.device}-${Date.now()}.png`
                            a.click()
                          }}>
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Firecrawl Section */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                Scrape Content (Firecrawl)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Extract clean markdown and HTML from any URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={scrapeUrlInput}
                    onChange={(e) => setScrapeUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    className="flex-1 bg-slate-800 border-slate-700 text-white"
                  />
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={prepareScrape}
                    disabled={isScraping || !scrapeUrlInput.trim()}
                  >
                    {isScraping ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scraping...</>
                    ) : (
                      <><FileText className="w-4 h-4 mr-2" /> Scrape</>
                    )}
                  </Button>
                </div>
                
                {scrapedData && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{scrapedData.title || 'Scraped Content'}</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-slate-700 text-slate-300"
                        onClick={() => {
                          if (scrapedData.markdown) {
                            const blob = new Blob([scrapedData.markdown], { type: 'text/markdown' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `scraped-${Date.now()}.md`
                            a.click()
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" /> Download MD
                      </Button>
                    </div>
                    {scrapedData.markdown && (
                      <div className="bg-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">{scrapedData.markdown.substring(0, 2000)}...</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSubTab === 'sites' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Scan className="w-5 h-5 text-blue-500" />
              Saved WordPress Sites
            </h3>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300"
              onClick={() => setNotice({
                type: 'warning',
                title: 'Add Site requires writeback',
                message: 'This static deployment can display saved sites, but adding a persistent WordPress site needs a server endpoint or Supabase write permission.',
              })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          </div>
          {sites.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6 text-sm text-slate-400">
                No live WordPress sites are connected in this embedded dashboard. Open the full tool for production site records.
              </CardContent>
            </Card>
          ) : sites.map((site) => (
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
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                  onClick={() => setNotice({
                    type: 'info',
                    title: 'Mapping preview is current',
                    message: 'The connected spreadsheet mapping is displayed above. Live row preview needs the server-side Sheets integration.',
                  })}
                >
                  Preview Mapping
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setNotice({
                    type: 'warning',
                    title: 'Sheets writeback is gated',
                    message: 'Writing to Google Sheets cannot run safely from this static browser bundle. Use the full Paperclip/n8n workflow for the real writeback.',
                  })}
                >
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
