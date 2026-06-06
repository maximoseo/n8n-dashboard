'use client'

import { cn } from '@/lib/utils'
import {
  Workflow,
  Globe,
  Search,
  Link2,
  Copy,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Paperclip,
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { id: 'workflows', label: 'Workflows', icon: Workflow, count: null },
  { id: 'urls', label: 'URLs Previewer', icon: Globe, count: null },
  { id: 'kwresearch', label: 'KW Research', icon: Search, count: null },
  { id: 'linkbuilding', label: 'Link Building', icon: Link2, count: null },
  { id: 'nofollow', label: 'Nofollow Clone', icon: Copy, count: null },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, count: null },
  { id: 'seotools', label: 'SEO Tools', icon: Settings, count: null },
]

export function Sidebar({ activeTab, onTabChange, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 shrink-0',
        'w-16 md:w-auto',
        collapsed ? 'md:w-16' : 'md:w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Workflow className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">n8n</span>
          </div>
        )}
        {(collapsed || !collapsed) && (
          <div className={cn(
            'w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center mx-auto',
            collapsed ? 'flex' : 'flex md:hidden'
          )}>
            <Workflow className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'hidden md:block p-1 rounded-lg hover:bg-slate-800 text-slate-400',
            collapsed && 'absolute -right-3 bg-slate-800 border border-slate-700'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              title={item.label}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="hidden md:block flex-1 text-left">{item.label}</span>
                  {item.count !== null && (
                    <span className="hidden md:inline text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <a
          href="https://maximo-dashboard-company-paperclip.onrender.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Paperclip AI"
          title="Paperclip AI"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <Paperclip className="w-5 h-5" />
          {!collapsed && <span className="hidden md:inline">Paperclip AI</span>}
        </a>
      </div>
    </aside>
  )
}
