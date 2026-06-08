/**
 * Alert evaluation + dispatch (server-only). Reads synced workflow/execution
 * data, evaluates rules (src/lib/aggregate), and notifies via Telegram and/or
 * email. Every channel degrades gracefully when its credentials are absent.
 */
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '@/lib/env'
import {
  computeOverviewKpis,
  clusterErrors,
  evaluateAlerts,
  type KpiWorkflow,
  type ErrExec,
  type Alert,
  type AlertThresholds,
} from '@/lib/aggregate'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendEmail } from '@/lib/resend'

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID || ''
const ALERT_EMAIL = process.env.ALERT_EMAIL || ''

export interface AlertRunResult {
  ok: boolean
  alerts: Alert[]
  dispatched: { telegram: 'sent' | 'skipped' | 'failed'; email: 'sent' | 'skipped' | 'failed' }
  source: 'supabase' | 'unconfigured'
}

function db() {
  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function runAlertCheck(thresholds: AlertThresholds = {}): Promise<AlertRunResult> {
  const client = db()
  if (!client) {
    return { ok: false, alerts: [], dispatched: { telegram: 'skipped', email: 'skipped' }, source: 'unconfigured' }
  }

  const [{ data: wfRows }, { data: errRows }] = await Promise.all([
    client.from('n8nmon_workflows').select('active, last_execution_status, success_rate_7d, risk_score, health_band, total_executions, avg_duration_ms, tags, category'),
    client.from('n8nmon_executions').select('n8n_execution_id, n8n_workflow_id, error_fingerprint, started_at').eq('status', 'error').order('started_at', { ascending: false }).limit(500),
  ])

  const workflows: KpiWorkflow[] = (wfRows ?? []).map((w: any) => ({
    status: !w.active ? 'paused' : w.last_execution_status === 'error' ? 'error' : 'active',
    runs: w.total_executions ?? 0,
    successRate7d: w.success_rate_7d,
    riskScore: w.risk_score,
    healthBand: w.health_band,
    lastExecutionStatus: w.last_execution_status,
    avgDurationMs: w.avg_duration_ms,
    tags: Array.isArray(w.tags) ? w.tags : [],
    category: w.category,
  }))
  const execs: ErrExec[] = (errRows ?? []).map((e: any) => ({
    n8nExecutionId: e.n8n_execution_id,
    workflowName: e.n8n_workflow_id,
    errorFingerprint: e.error_fingerprint,
    startedAt: e.started_at,
  }))

  const kpis = computeOverviewKpis(workflows)
  const clusters = clusterErrors(execs)
  const alerts = evaluateAlerts(kpis, clusters, thresholds)

  const dispatched: AlertRunResult['dispatched'] = { telegram: 'skipped', email: 'skipped' }
  if (alerts.length > 0) {
    const body = alerts.map((a) => `${a.severity === 'critical' ? '🚨' : '⚠️'} ${a.title} — ${a.detail}`).join('\n')

    if (process.env.TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const r = await sendTelegramMessage({ chat_id: TELEGRAM_CHAT_ID, text: `<b>n8n Dashboard Alerts</b>\n\n${body}`, parse_mode: 'HTML' })
      dispatched.telegram = r.success ? 'sent' : 'failed'
    }
    if (process.env.RESEND_API_KEY && ALERT_EMAIL) {
      const r = await sendEmail({ to: ALERT_EMAIL, subject: `n8n Dashboard: ${alerts.length} alert(s)`, text: body })
      dispatched.email = r.success ? 'sent' : 'failed'
    }
  }

  return { ok: true, alerts, dispatched, source: 'supabase' }
}
