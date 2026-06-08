'use client'

import { Bell, User, LogOut, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  onLogout: () => void
}

export function Header({ onLogout }: HeaderProps) {
  const { user } = useAuth()
  const userEmail = user?.email || 'user@maximo-seo.ai'

  return (
    <header className="sticky top-0 z-50 flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-3 py-2 backdrop-blur sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Automation Command Center</p>
          <p className="truncate text-xs text-slate-500">n8n health, workflows, SEO modules and reports</p>
        </div>
        <div className="relative hidden w-full max-w-96 lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search workflows, URLs, keywords..."
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <a
          href="https://dashboards-panel.maximo-seo.ai/"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-300/60 bg-cyan-500/15 px-3 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-500/15 transition-colors hover:bg-cyan-400/20 hover:text-white"
          aria-label="Back to all dashboards"
          title="Back to all dashboards"
        >
          <span className="hidden sm:inline">All Dashboards</span>
          <span className="sm:hidden">All</span>
        </a>

        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white relative"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-medium">
            3
          </span>
        </Button>

        <div className="mx-1 hidden h-6 w-px bg-slate-800 sm:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-medium text-white">{userEmail || 'user@maximo-seo.ai'}</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
