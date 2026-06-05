'use client'

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

type ActionNoticeType = 'info' | 'success' | 'warning' | 'error'

interface ActionNoticeProps {
  type?: ActionNoticeType
  title: string
  message: string
  onDismiss?: () => void
}

const styles = {
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
  success: 'border-green-500/30 bg-green-500/10 text-green-200',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-100',
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
}

export function ActionNotice({ type = 'info', title, message, onDismiss }: ActionNoticeProps) {
  const Icon = icons[type]

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${styles[type]}`} role="status">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss notice"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
