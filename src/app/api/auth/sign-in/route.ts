import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAuthRateLimit, getClientIp } from '@/lib/auth-rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const fixedDashboardUsername = process.env.DASHBOARD_AUTH_USERNAME?.trim().toLowerCase() || ''
const fixedDashboardEmail = process.env.DASHBOARD_AUTH_EMAIL?.trim() || ''

function resolveLoginEmail(identifier: string) {
  const trimmedIdentifier = identifier.trim()

  if (
    fixedDashboardUsername &&
    fixedDashboardEmail &&
    trimmedIdentifier.toLowerCase() === fixedDashboardUsername
  ) {
    return fixedDashboardEmail
  }

  return trimmedIdentifier
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const identifier = typeof body === 'object' && body !== null && 'identifier' in body
    ? (body as { identifier?: unknown }).identifier
    : undefined
  const password = typeof body === 'object' && body !== null && 'password' in body
    ? (body as { password?: unknown }).password
    : undefined

  if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Enter your username and password.' }, { status: 400 })
  }

  const normalizedIdentifier = identifier.trim().toLowerCase()
  const ip = getClientIp(request)
  const [ipAllowed, identifierAllowed] = await Promise.all([
    checkAuthRateLimit(`signin:ip:${ip}`),
    checkAuthRateLimit(`signin:identifier:${normalizedIdentifier}`),
  ])

  if (!ipAllowed || !identifierAllowed) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolveLoginEmail(identifier),
    password,
  })

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message || 'Invalid login credentials.' }, { status: 401 })
  }

  return NextResponse.json({ session: data.session })
}
