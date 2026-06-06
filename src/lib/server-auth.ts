import { NextRequest, NextResponse } from 'next/server'

export async function requireAuthenticatedUser(request: NextRequest) {
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
