'use client'

import {
  ArrowUpRight,
  Bot,
  CheckCircle,
  Code2,
  ExternalLink,
  FileSearch,
  Lock,
  MonitorCog,
  ShieldAlert,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ModuleItem {
  name: string
  url: string
  status: 'Live' | 'Auth flow' | 'Live origin' | 'Embed blocked'
  group: 'n8n Ops' | 'HTML Studio' | 'Content Research'
  description: string
  treatment: string
  icon: typeof Workflow
}

const modules: ModuleItem[] = [
  {
    name: 'New n8n Setup Dashboard',
    url: 'https://new-n8n-setup-dashboard.maximo-seo.ai/',
    status: 'Live',
    group: 'n8n Ops',
    description: 'Onboarding control room for new n8n deployments, handoff checks, workflow readiness, and setup evidence.',
    treatment: 'Native operational summary with a production deep link.',
    icon: Workflow,
  },
  {
    name: 'n8n Monitoring Dashboard',
    url: 'https://hermes-n8n-dashboard.onrender.com/',
    status: 'Live origin',
    group: 'n8n Ops',
    description: 'Monitoring lane for workflow health, failed runs, latency checks, and escalation status.',
    treatment: 'Native status lane with a verified Render origin launch for rollback.',
    icon: MonitorCog,
  },
  {
    name: 'Automation Dashboard',
    url: 'https://automation.maximo-seo.ai/',
    status: 'Embed blocked',
    group: 'n8n Ops',
    description: 'Automation command center for workflow routing, operational triggers, and execution shortcuts.',
    treatment: 'No iframe: X-Frame-Options is SAMEORIGIN. Use summary plus direct launch.',
    icon: Bot,
  },
  {
    name: 'HTML Redesign Studio',
    url: 'https://hermes-html-redesign-studio.onrender.com/',
    status: 'Live origin',
    group: 'HTML Studio',
    description: 'Studio lane for redesign briefs, HTML transformation requests, visual QA, and client-ready outputs.',
    treatment: 'Native studio launcher with a verified Render origin launch for rollback.',
    icon: Code2,
  },
  {
    name: 'HTML Improvement',
    url: 'https://webs-html-improvements-files.onrender.com/login?redirect=%2F',
    status: 'Auth flow',
    group: 'HTML Studio',
    description: 'Improvement workflow for existing HTML pages, polish passes, QA fixes, and implementation notes.',
    treatment: 'Native action summary with login-aware deep link.',
    icon: Sparkles,
  },
  {
    name: 'HTML Redesign Dashboard',
    url: 'https://html-redesign-vps.onrender.com/login?redirect=%2F',
    status: 'Auth flow',
    group: 'HTML Studio',
    description: 'Production redesign dashboard for request tracking, generated variants, approvals, and rollout notes.',
    treatment: 'Native action summary with login-aware deep link.',
    icon: FileSearch,
  },
  {
    name: 'Paperclip Content Research',
    url: 'https://paperclip-content-research-company.onrender.com/',
    status: 'Live origin',
    group: 'Content Research',
    description: 'Research lane for Paperclip content briefs, source discovery, topic clusters, and evidence collection.',
    treatment: 'Native research lane with a verified Render origin launch for rollback.',
    icon: FileSearch,
  },
]

const groups: ModuleItem['group'][] = ['n8n Ops', 'HTML Studio', 'Content Research']

const statusStyles: Record<ModuleItem['status'], string> = {
  Live: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  'Auth flow': 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  'Live origin': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  'Embed blocked': 'border-rose-500/30 bg-rose-500/10 text-rose-300',
}

const statusIcons: Record<ModuleItem['status'], typeof CheckCircle> = {
  Live: CheckCircle,
  'Auth flow': Lock,
  'Live origin': CheckCircle,
  'Embed blocked': ShieldAlert,
}

export function ModuleSuiteTab() {
  const liveCount = modules.filter((module) => module.status === 'Live').length
  const protectedCount = modules.filter((module) => module.status === 'Auth flow' || module.status === 'Embed blocked').length
  const liveOriginCount = modules.filter((module) => module.status === 'Live origin').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">Canonical n8n suite</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Automation, HTML and content modules</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            Seven standalone dashboards are now represented inside the main n8n Dashboard as professional modules. Secure tools stay behind their own auth flows and blocked embeds use direct launch actions instead of unsafe iframes.
          </p>
        </div>
        <a
          href="https://dashboards-panel.maximo-seo.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
        >
          Source panel
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-400">Live direct modules</CardDescription>
            <CardTitle className="text-3xl text-white">{liveCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-400">Auth / embed guarded</CardDescription>
            <CardTitle className="text-3xl text-white">{protectedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-400">Verified Render origins</CardDescription>
            <CardTitle className="text-3xl text-white">{liveOriginCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {groups.map((group) => (
        <section key={group} className="space-y-3" aria-labelledby={`${group.toLowerCase().replace(/\s+/g, '-')}-heading`}>
          <div>
            <h2 id={`${group.toLowerCase().replace(/\s+/g, '-')}-heading`} className="text-xl font-semibold text-white">{group}</h2>
            <p className="text-sm text-slate-400">Native summary cards with safe production launch paths.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {modules.filter((module) => module.group === group).map((module) => {
              const Icon = module.icon
              const StatusIcon = statusIcons[module.status]
              return (
                <Card key={module.name} className="flex h-full flex-col border-slate-800 bg-slate-900">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="break-words text-base text-white">{module.name}</CardTitle>
                          <CardDescription className="mt-1 text-slate-400">{module.group}</CardDescription>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`mt-3 w-fit gap-1 whitespace-normal border ${statusStyles[module.status]}`}>
                      <StatusIcon className="h-3 w-3" />
                      {module.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <p className="text-sm leading-6 text-slate-300">{module.description}</p>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs leading-5 text-slate-400">
                      <strong className="block text-slate-200">Integration treatment</strong>
                      {module.treatment}
                    </div>
                    <a
                      href={module.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                      aria-label={`Open ${module.name}`}
                    >
                      Open module
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
