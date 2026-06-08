import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { serverEnv } from '@/lib/env'
import { SEO_PACKS } from '@/lib/seo-packs'

export const dynamic = 'force-dynamic'

/** Return the pack catalog + recent run history. */
export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response

  let runs: unknown[] = []
  if (serverEnv.SUPABASE_URL && serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data } = await db
      .from('n8nmon_pack_runs')
      .select('id, pack_id, domain, status, overall_score, triggered_via, created_at, finished_at')
      .order('created_at', { ascending: false })
      .limit(50)
    runs = data ?? []
  }

  return NextResponse.json({ packs: SEO_PACKS, runs })
}
