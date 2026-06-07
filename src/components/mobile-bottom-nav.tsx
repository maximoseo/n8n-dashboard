'use client'

import { BarChart3, Bot, Copy, Globe, LayoutGrid, Link2, Search, Settings, Workflow } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const items = [
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'urls', label: 'URLs', icon: Globe },
  { id: 'kwresearch', label: 'KW', icon: Search },
  { id: 'linkbuilding', label: 'Links', icon: Link2 },
  { id: 'nofollow', label: 'Clone', icon: Copy },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'modules', label: 'Suite', icon: LayoutGrid },
  { id: 'analytics', label: 'Stats', icon: BarChart3 },
  { id: 'seotools', label: 'Tools', icon: Settings },
]

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden">
      <div className="flex gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors',
                isActive ? 'bg-blue-600/15 text-blue-300' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              )}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
