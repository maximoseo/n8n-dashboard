'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  ExternalLink,
  FileText,
  Download,
  BarChart2,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Plus,
  Filter,
  ArrowRight,
} from 'lucide-react'

const projects = [
  { id: 1, name: 'Dental SEO Q3', keywords: 156, status: 'active', progress: 78, lastRun: '2 hours ago' },
  { id: 2, name: 'Chiropractic Local', keywords: 89, status: 'completed', progress: 100, lastRun: '1 day ago' },
  { id: 3, name: 'Real Estate NYC', keywords: 234, status: 'active', progress: 45, lastRun: '30 min ago' },
  { id: 4, name: 'E-commerce Audit', keywords: 567, status: 'error', progress: 23, lastRun: '3 hours ago' },
]

const recentRuns = [
  { id: 1, project: 'Dental SEO Q3', type: 'SERP Analysis', keywords: 45, status: 'completed', date: '10 min ago' },
  { id: 2, project: 'Real Estate NYC', type: 'Competitor Discovery', keywords: 23, status: 'completed', date: '25 min ago' },
  { id: 3, project: 'Chiropractic Local', type: 'Validation', keywords: 89, status: 'processing', date: 'just now' },
]

export function KwResearchTab() {
  const [briefText, setBriefText] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-500" />
            KW Research
          </h1>
          <p className="text-slate-400 mt-1">Project research, run history, overlap analysis, and content briefs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Full Dashboard
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Keyword Project Intake
              </CardTitle>
              <CardDescription className="text-slate-400">
                Queue your research brief here before running the server-side pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  value={briefText}
                  onChange={(e) => setBriefText(e.target.value)}
                  placeholder="Describe your keyword research needs...&#10;- Target industry: Dental&#10;- Location: Miami, FL&#10;- Primary services: implants, veneers, emergency&#10;- Competitors to analyze:..."
                  className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                      <Target className="w-3 h-3 mr-1" />
                      SERP Intent
                    </Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                      <BarChart2 className="w-3 h-3 mr-1" />
                      Competitor Discovery
                    </Badge>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Queue Research
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Active Projects</h3>
              <Button variant="ghost" size="sm" className="text-slate-400">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            {projects.map((project) => (
              <Card key={project.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{project.name}</h4>
                        {project.status === 'active' && <Badge variant="success">Active</Badge>}
                        {project.status === 'completed' && <Badge variant="secondary">Completed</Badge>}
                        {project.status === 'error' && <Badge variant="danger">Error</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span>{project.keywords} keywords</span>
                        <span>Last run: {project.lastRun}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Recent Runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentRuns.map((run) => (
                <div key={run.id} className="p-3 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white text-sm">{run.project}</span>
                    {run.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{run.type}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                      {run.keywords} keywords
                    </Badge>
                    <span className="text-xs text-slate-500">{run.date}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Content Briefs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between border-slate-700 text-slate-300">
                <span>Generate Brief</span>
                <FileText className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between border-slate-700 text-slate-300">
                <span>Export Workbook</span>
                <Download className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white text-sm">Cannibalization Alert</p>
                  <p className="text-xs text-slate-400 mt-1">
                    3 keyword conflicts detected between &quot;Dental Implants Miami&quot; pages
                  </p>
                  <Button variant="ghost" size="sm" className="text-blue-400 p-0 h-auto mt-1 text-xs hover:text-blue-300 hover:bg-blue-500/10">
                    View Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
