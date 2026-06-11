'use client'

import { supabase } from '@/lib/supabase'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const isSeoAuditBridge = process.env.NEXT_PUBLIC_SEO_AUDIT_BRIDGE === '1'

export function appFetchPath(input: string): string {
  if (!basePath || !input.startsWith('/api/')) return input
  if (input.startsWith(`${basePath}/`)) return input
  return `${basePath}${input}`
}

/** Client-side fetch that attaches the Supabase access token as a Bearer header outside the SEO Audit bridge. */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (!isSeoAuditBridge) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  return fetch(appFetchPath(input), { ...init, headers })
}

/** Trigger a browser download from a fetch Response body. */
export async function downloadResponse(res: Response, filename: string): Promise<void> {
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Trigger a browser download from a string (e.g. generated markdown). */
export function downloadText(text: string, filename: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
