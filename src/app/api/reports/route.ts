import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { serverEnv } from '@/lib/env'
import { computeBusinessValue, estimateApiCost, estimateManualHoursSaved, summarizeRoi, type RoiWorkflow } from '@/lib/roi'
import { computeOverviewKpis, type KpiWorkflow } from '@/lib/aggregate'
import { buildOpsReportMarkdown, rowsToCsv, type OpsReport, type ReportWorkflowRow } from '@/lib/reports'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/** Internal ops report. ?format=md|csv|json (default md). */
export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const format = (new URL(request.url).searchParams.get('format') || 'md').toLowerCase()

  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'report store not configured' }, { status: 503 })
  }
  const db = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data } = await db
    .from('n8nmon_workflows')
    .select('name, category, active, total_executions, success_rate_7d, risk_score, health_score, last_execution_status, health_band, tags')

  const wfs = data ?? []
  const kpiWfs: KpiWorkflow[] = wfs.map((w: any) => ({
    status: !w.active ? 'paused' : w.last_execution_status === 'error' ? 'error' : 'active',
    runs: w.total_executions ?? 0,
    successRate7d: w.success_rate_7d,
    healthBand: w.health_band,
    lastExecutionStatus: w.last_execution_status,
    tags: Array.isArray(w.tags) ? w.tags : [],
    category: w.category,
  }))
  const kpis = computeOverviewKpis(kpiWfs)
  const roi = summarizeRoi(wfs.map((w: any): RoiWorkflow => ({ name: w.name, category: w.category, active: !!w.active, totalExecutions: w.total_executions ?? 0, successRate7d: w.success_rate_7d, hasTags: Array.isArray(w.tags) && w.tags.length > 0 })))

  const rows: ReportWorkflowRow[] = wfs.map((w: any) => {
    const rw: RoiWorkflow = { name: w.name, category: w.category, active: !!w.active, totalExecutions: w.total_executions ?? 0, successRate7d: w.success_rate_7d, hasTags: Array.isArray(w.tags) && w.tags.length > 0 }
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

  const report: OpsReport = {
    generatedAt: new Date().toISOString(),
    totals: {
      workflows: kpis.total,
      active: kpis.active,
      failing: kpis.failing,
      atRisk: kpis.atRisk,
      manualHoursSaved: roi.manualHoursSaved,
      apiCostEstimate: roi.apiCostEstimate,
      avgBusinessValue: roi.avgBusinessValue,
    },
    topValuable: [...rows].sort((a, b) => (b.businessValue || 0) - (a.businessValue || 0)).slice(0, 10),
    leastReliable: [...rows].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 10),
    mostExpensive: [...rows].sort((a, b) => (b.apiCost || 0) - (a.apiCost || 0)).slice(0, 10),
  }

  await recordAudit({ userId: auth.user?.id ?? auth.user?.sub ?? null, action: 'report.export', resourceType: 'report', details: { format } })

  if (format === 'json') return NextResponse.json(report)
  if (format === 'csv') {
    return new NextResponse(rowsToCsv(rows), {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="n8n-ops-report.csv"' },
    })
  }
  return new NextResponse(buildOpsReportMarkdown(report), {
    headers: { 'Content-Type': 'text/markdown', 'Content-Disposition': 'attachment; filename="n8n-ops-report.md"' },
  })
}
