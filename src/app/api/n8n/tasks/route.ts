import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { serverEnv } from '@/lib/env'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

function db() {
  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** List dashboard tasks. */
export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const client = db()
  if (!client) return NextResponse.json({ tasks: [], source: 'unconfigured' })
  const { data } = await client
    .from('n8nmon_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  return NextResponse.json({ tasks: data ?? [], source: 'supabase' })
}

/** Create a dashboard task (e.g. from a workflow failure or operator action). */
export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const userId = auth.user?.id ?? auth.user?.sub ?? null

  const body = await request.json().catch(() => ({}))
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const client = db()
  if (!client) return NextResponse.json({ error: 'task store not configured (SUPABASE_SERVICE_ROLE_KEY)' }, { status: 503 })

  const { data, error } = await client
    .from('n8nmon_tasks')
    .insert({
      title,
      description: typeof body?.description === 'string' ? body.description : null,
      source: typeof body?.source === 'string' ? body.source : 'manual',
      workflow_n8n_id: typeof body?.workflowId === 'string' ? body.workflowId : null,
      severity: typeof body?.severity === 'string' ? body.severity : 'medium',
      created_by: userId,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await recordAudit({ userId, action: 'task.create', resourceType: 'task', resourceId: data?.id, details: { title } })
  return NextResponse.json({ ok: true, id: data?.id })
}
