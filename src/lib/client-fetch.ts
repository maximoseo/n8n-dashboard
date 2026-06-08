'use client'

import { supabase } from '@/lib/supabase'

/** Client-side fetch that attaches the Supabase access token as a Bearer header. */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) }
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
  return fetch(input, { ...init, headers })
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
