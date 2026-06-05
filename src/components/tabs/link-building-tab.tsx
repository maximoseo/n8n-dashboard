'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ActionNotice } from '@/components/action-notice'
import {
  Link2,
  Plus,
  Target,
  ExternalLink,
  Star,
  AlertTriangle,
  CheckCircle,
  Mail,
  Send,
  FileText,
  BarChart3,
  Globe,
} from 'lucide-react'

const campaigns = [
  {
    id: 1,
    site: 'industry-blog.com',
    targetPage: '/services/dental-implants',
    anchorStrategy: 'branded + partial match',
    qualityScore: 85,
    riskLevel: 'low',
    status: 'outreach',
  },
  {
    id: 2,
    site: 'local-directory.org',
    targetPage: '/locations/miami',
    anchorStrategy: 'naked URL',
    qualityScore: 62,
    riskLevel: 'medium',
    status: 'negotiating',
  },
  {
    id: 3,
    site: 'news-site.com',
    targetPage: '/about',
    anchorStrategy: 'editorial mention',
    qualityScore: 92,
    riskLevel: 'low',
    status: 'approved',
  },
]

const playbooks = [
  { id: 1, name: 'Editorial Digital PR', description: 'Pitch newsworthy angles to journalists' },
  { id: 2, name: 'Broken Link Building', description: 'Find and replace dead resources' },
  { id: 3, name: 'Unlinked Mentions', description: 'Convert brand references to links' },
  { id: 4, name: 'Resource Page Outreach', description: 'Get listed on curated link pages' },
]

type Campaign = typeof campaigns[number]

export function LinkBuildingTab() {
  const [newCampaign, setNewCampaign] = useState({ site: '', targetPage: '', anchor: '' })
  const [campaignList, setCampaignList] = useState<Campaign[]>(campaigns)
  const [notice, setNotice] = useState<{title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error'} | null>(null)

  const scoreOpportunity = () => {
    if (!newCampaign.site.trim() || !newCampaign.targetPage.trim()) {
      setNotice({
        type: 'warning',
        title: 'Campaign details missing',
        message: 'Add at least a target site and target page before scoring the opportunity.',
      })
      return
    }

    const score = Math.max(35, Math.min(95, 55 + newCampaign.site.length + newCampaign.targetPage.length % 25))
    setCampaignList(prev => [{
      id: Date.now(),
      site: newCampaign.site.trim(),
      targetPage: newCampaign.targetPage.trim(),
      anchorStrategy: newCampaign.anchor.trim() || 'editorial mention',
      qualityScore: score,
      riskLevel: score >= 75 ? 'low' : 'medium',
      status: 'outreach',
    }, ...prev])
    setNewCampaign({ site: '', targetPage: '', anchor: '' })
    setNotice({
      type: 'success',
      title: 'Opportunity scored locally',
      message: 'The campaign was added to this session. Persistent outreach and sending still run through Paperclip.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-6 h-6 text-blue-500" />
            Link Building
          </h1>
          <p className="text-slate-400 mt-1">Inbound & external backlink campaigns — outreach, scoring, and risk review</p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://maximo-dashboard-company-paperclip.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-transparent px-4 py-2 font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Paperclip
          </a>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setNotice({
              type: 'info',
              title: 'Use the form below',
              message: 'Fill site, target page, and anchor strategy, then click Score Opportunity to add a campaign.',
            })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Campaign
          </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Active Campaigns
              </CardTitle>
              <CardDescription className="text-slate-400">
                Track external backlinks and outreach progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaignList.map((campaign) => (
                <div key={campaign.id} className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{campaign.site}</span>
                          {campaign.riskLevel === 'low' && <Badge variant="success">Low Risk</Badge>}
                          {campaign.riskLevel === 'medium' && <Badge variant="warning">Medium Risk</Badge>}
                          {campaign.riskLevel === 'high' && <Badge variant="danger">High Risk</Badge>}
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                          Target: {campaign.targetPage}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                            {campaign.anchorStrategy}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Star className="w-3 h-3 text-yellow-500" />
                            Quality: {campaign.qualityScore}/100
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {campaign.status === 'approved' ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </Badge>
                      ) : campaign.status === 'outreach' ? (
                        <Badge variant="secondary">Outreach</Badge>
                      ) : (
                        <Badge variant="warning">Negotiating</Badge>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 h-8 w-8 p-0"
                          aria-label={`Draft outreach email for ${campaign.site}`}
                          title="Draft outreach email"
                          onClick={() => {
                            window.location.href = `mailto:?subject=Link opportunity for ${encodeURIComponent(campaign.site)}&body=${encodeURIComponent(`Target page: ${campaign.targetPage}\nAnchor strategy: ${campaign.anchorStrategy}`)}`
                          }}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 h-8 w-8 p-0"
                          aria-label={`Send ${campaign.site} through Paperclip`}
                          title="Send through Paperclip"
                          onClick={() => setNotice({
                            type: 'warning',
                            title: 'Outreach sending is server-side',
                            message: 'The email draft can open locally, but real outreach sending should run through Paperclip so credentials, throttling, and logs stay controlled.',
                          })}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Add New Campaign</CardTitle>
              <CardDescription className="text-slate-400">
                Capture site, target page, and anchor strategy for scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Target Site</label>
                  <Input
                    placeholder="example.com"
                    value={newCampaign.site}
                    onChange={(e) => setNewCampaign({ ...newCampaign, site: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Target Page</label>
                  <Input
                    placeholder="/services/..."
                    value={newCampaign.targetPage}
                    onChange={(e) => setNewCampaign({ ...newCampaign, targetPage: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Anchor Strategy</label>
                  <Input
                    placeholder="branded, partial, editorial..."
                    value={newCampaign.anchor}
                    onChange={(e) => setNewCampaign({ ...newCampaign, anchor: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={scoreOpportunity}>
                <Plus className="w-4 h-4 mr-2" />
                Score Opportunity
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Linkable Asset Playbooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {playbooks.map((playbook) => (
                <div key={playbook.id} className="p-3 bg-slate-800 rounded-lg">
                  <p className="font-medium text-white text-sm">{playbook.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{playbook.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Scoring & Risk Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="font-medium text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Quality Factors
                </p>
                <ul className="text-slate-400 text-xs mt-2 space-y-1">
                  <li>• Topical fit with target</li>
                  <li>• Editorial/digital PR context</li>
                  <li>• Diverse anchor text</li>
                  <li>• Relevant domain authority</li>
                </ul>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="font-medium text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Flags
                </p>
                <ul className="text-slate-400 text-xs mt-2 space-y-1">
                  <li>• Missing rel=sponsored (paid)</li>
                  <li>• Missing rel=ugc (forums)</li>
                  <li>• Niche edit patterns</li>
                  <li>• Exact-match over-optimization</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
