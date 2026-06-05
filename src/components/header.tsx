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
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative hidden md:block w-full max-w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search workflows, URLs, keywords..."
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
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

        <div className="h-6 w-px bg-slate-800 mx-1" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-medium text-white">{userEmail || 'user@maximo-seo.ai'}</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
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
