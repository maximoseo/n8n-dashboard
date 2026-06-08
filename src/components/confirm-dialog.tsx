'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  requireReason?: boolean
  busy?: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

/**
 * Confirmation modal for high-risk actions. When requireReason is set, the
 * confirm button stays disabled until a reason is entered (gates production
 * mutations like activate/deactivate).
 */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', requireReason, busy, onCancel, onConfirm }: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  if (!open) return null
  const canConfirm = !busy && (!requireReason || reason.trim().length >= 3)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1">{message}</p>
          </div>
        </div>
        {requireReason && (
          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-1">Reason (required, audited)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you making this change?"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" className="text-slate-300" onClick={() => { setReason(''); onCancel() }} disabled={busy}>Cancel</Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            disabled={!canConfirm}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
