import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAuthRateLimit, getClientIp } from '@/lib/auth-rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const dashboardUrl = process.env.DASHBOARD_URL || process.env.NEXT_PUBLIC_DASHBOARD_URL || ''

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function getTrustedResetRedirect() {
  try {
    const url = new URL(dashboardUrl)
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
      return null
    }
    return `${url.origin}/auth/reset`
  } catch {
    return null
  }
}

function genericResetResponse() {
  return NextResponse.json({
    message: 'If an account exists for that email, a reset link has been sent.',
  })
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = typeof body === 'object' && body !== null && 'email' in body
    ? (body as { email?: unknown }).email
    : undefined

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const ip = getClientIp(request)
  const [ipAllowed, emailAllowed] = await Promise.all([
    checkAuthRateLimit(`reset:ip:${ip}`),
    checkAuthRateLimit(`reset:email:${normalizedEmail}`),
  ])

  if (!ipAllowed || !emailAllowed) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const redirectTo = getTrustedResetRedirect()
  if (!supabaseUrl || !supabaseAnonKey || !redirectTo) {
    return genericResetResponse()
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo })
  } catch {
    return genericResetResponse()
  }

  return genericResetResponse()
}
