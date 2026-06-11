import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

export const SEO_AUDIT_BRIDGE_HEADER = 'x-seo-audit-bridge-secret'

function safeEqual(a: string, b: string) {
  const left = crypto.createHash('sha256').update(a).digest()
  const right = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(left, right)
}

export function isSeoAuditBridgeRequired() {
  return Boolean(process.env.SEO_AUDIT_BRIDGE_SECRET)
}

export function hasValidSeoAuditBridgeHeader(headers: Pick<Headers, 'get'>) {
  const expected = process.env.SEO_AUDIT_BRIDGE_SECRET
  const received = headers.get(SEO_AUDIT_BRIDGE_HEADER)
  if (!expected || !received) return false
  return safeEqual(received, expected)
}

function bridgeUser(headers: Pick<Headers, 'get'>) {
  const forwarded = headers.get('x-seo-audit-bridge-user') || 'seo-audit-pro@maximo-seo.ai'
  return {
    id: 'seo-audit-pro-bridge',
    email: forwarded,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'seo-audit-pro-bridge' },
    user_metadata: {},
  }
}

export async function requireAuthenticatedUser(request: NextRequest) {
  if (isSeoAuditBridgeRequired()) {
    if (hasValidSeoAuditBridgeHeader(request.headers)) {
      return {
        response: null,
        user: bridgeUser(request.headers),
      }
    }
    return {
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
      user: null,
    }
  }

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]

  if (!token) {
    return {
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
      user: null,
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      response: NextResponse.json({ error: 'Authentication is not configured' }, { status: 500 }),
      user: null,
    }
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return {
      response: NextResponse.json({ error: 'Invalid session' }, { status: 401 }),
      user: null,
    }
  }

  return {
    response: null,
    user: await response.json(),
  }
}
