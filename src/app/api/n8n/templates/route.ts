import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { serverEnv } from '@/lib/env'
import { getN8nClient } from '@/lib/n8n/factory'
import { redactAll } from '@/lib/redaction'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

function db() {
  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** List templates. */
export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const client = db()
  if (!client) return NextResponse.json({ templates: [], source: 'unconfigured' })
  const { data } = await client
    .from('n8nmon_templates')
    .select('id, name, category, description, required_credentials, install_mode, origin, status, source_workflow_id, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  return NextResponse.json({ templates: data ?? [], source: 'supabase' })
}

/**
 * Create a template. Either import an existing workflow (`workflowId`) — its
 * JSON is fetched + REDACTED before storage — or store a provided draft.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const userId = auth.user?.id ?? auth.user?.sub ?? null

  const body = await request.json().catch(() => ({}))
  const store = db()
  if (!store) return NextResponse.json({ error: 'template store not configured' }, { status: 503 })

  let workflowJson: unknown = body?.workflow_json ?? null
  let name = typeof body?.name === 'string' ? body.name.trim() : ''
  let credentials: string[] = []

  if (body?.workflowId) {
    const client = getN8nClient()
    if (!client) return NextResponse.json({ error: 'n8n API key not configured' }, { status: 503 })
    try {
      const wf = (await client.getWorkflow(String(body.workflowId))) as any
      workflowJson = redactAll(wf)
      if (!name) name = `${wf?.name ?? 'Workflow'} (template)`
      const nodes = Array.isArray(wf?.nodes) ? wf.nodes : []
      credentials = [...new Set<string>(nodes.flatMap((n: any) => Object.keys(n?.credentials || {})))]
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'failed to import workflow' }, { status: 502 })
    }
  }

  if (!name) return NextResponse.json({ error: 'name (or workflowId) is required' }, { status: 400 })

  const { data, error } = await store
    .from('n8nmon_templates')
    .insert({
      name,
      category: typeof body?.category === 'string' ? body.category : 'general',
      description: typeof body?.description === 'string' ? body.description : null,
      required_credentials: credentials,
      workflow_json: workflowJson,
      install_mode: typeof body?.install_mode === 'string' ? body.install_mode : 'export_json',
      source_workflow_id: body?.workflowId ? String(body.workflowId) : null,
      origin: body?.origin === 'ai_builder' ? 'ai_builder' : 'import',
      status: 'draft',
      created_by: userId,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await recordAudit({ userId, action: 'template.create', resourceType: 'template', resourceId: data?.id, details: { name } })
  return NextResponse.json({ ok: true, id: data?.id })
}
