import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'

const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://websiseo.app.n8n.cloud'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response

  if (!N8N_API_KEY) {
    return NextResponse.json({ error: 'n8n API key is not configured' }, { status: 503 })
  }

  const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows?limit=250`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch n8n workflows' }, { status: 502 })
  }

  const data = await response.json()
  const workflows = Array.isArray(data.data) ? data.data : []
  const templates = workflows
    .filter((workflow) => /nofollow/i.test(workflow?.name || ''))
    .map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      active: Boolean(workflow.active),
      updatedAt: workflow.updatedAt || null,
      tags: Array.isArray(workflow.tags)
        ? workflow.tags.map((tag: any) => tag?.name || tag).filter(Boolean)
        : [],
    }))

  return NextResponse.json({
    source: 'n8n',
    templates,
    count: templates.length,
  })
}
