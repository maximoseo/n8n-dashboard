import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { getN8nClient } from '@/lib/n8n/factory'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/** Export a workflow's full JSON (read-only) for backup / cloning. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const { id } = await params

  const client = getN8nClient()
  if (!client) return NextResponse.json({ error: 'n8n API key not configured' }, { status: 503 })

  try {
    const wf = await client.getWorkflow(id)
    await recordAudit({
      userId: auth.user?.id ?? auth.user?.sub ?? null,
      action: 'n8n.workflow.export',
      resourceType: 'workflow',
      resourceId: id,
    })
    return new NextResponse(JSON.stringify(wf, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="workflow-${id}.json"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'export failed' }, { status: 502 })
  }
}
