import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { serverEnv } from '@/lib/env'
import { computeBusinessValue, estimateApiCost, estimateManualHoursSaved, summarizeRoi, type RoiWorkflow } from '@/lib/roi'

export const dynamic = 'force-dynamic'

function toRoiWorkflow(w: any): RoiWorkflow {
  return {
    name: w.name,
    category: w.category,
    active: !!w.active,
    totalExecutions: w.total_executions ?? 0,
    successRate7d: w.success_rate_7d,
    hasTags: Array.isArray(w.tags) && w.tags.length > 0,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response

  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ source: 'unconfigured', summary: null, topValuable: [], leastReliable: [], mostExpensive: [] })
  }
  const db = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data } = await db
    .from('n8nmon_workflows')
    .select('name, category, active, total_executions, success_rate_7d, risk_score, health_score, last_execution_status, tags')

  const rows = (data ?? []).map((w: any) => {
    const rw = toRoiWorkflow(w)
    return {
      name: w.name,
      status: !w.active ? 'paused' : w.last_execution_status === 'error' ? 'error' : 'active',
      healthScore: w.health_score,
      riskScore: w.risk_score,
      businessValue: computeBusinessValue(rw),
      manualHoursSaved: estimateManualHoursSaved(rw),
      apiCost: estimateApiCost(rw),
    }
  })

  return NextResponse.json({
    source: 'supabase',
    summary: summarizeRoi((data ?? []).map(toRoiWorkflow)),
    topValuable: [...rows].sort((a, b) => (b.businessValue || 0) - (a.businessValue || 0)).slice(0, 10),
    leastReliable: [...rows].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 10),
    mostExpensive: [...rows].sort((a, b) => (b.apiCost || 0) - (a.apiCost || 0)).slice(0, 10),
  })
}
