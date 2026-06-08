import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { getN8nClient } from '@/lib/n8n/factory'
import { generateWorkflowDocs } from '@/lib/n8n/docs'
import { redactAll } from '@/lib/redaction'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/** Generate deterministic Markdown documentation for a workflow (read-only). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const { id } = await params

  const client = getN8nClient()
  if (!client) return NextResponse.json({ error: 'n8n API key not configured' }, { status: 503 })

  try {
    const wf = await client.getWorkflow(id)
    const safe = redactAll(wf) as Record<string, unknown>
    const markdown = generateWorkflowDocs(safe)
    await recordAudit({
      userId: auth.user?.id ?? auth.user?.sub ?? null,
      action: 'n8n.workflow.docs',
      resourceType: 'workflow',
      resourceId: id,
    })
    return NextResponse.json({ id, markdown })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'docs failed' }, { status: 502 })
  }
}
