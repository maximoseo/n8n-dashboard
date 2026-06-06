import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'

const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://websiseo.app.n8n.cloud'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request)
    if (auth.response) return auth.response

    if (!N8N_API_KEY) {
      return NextResponse.json({ 
        error: 'n8n API key is not configured',
        source: 'unavailable',
      }, { status: 503 })
    }

    const workflows = await getAllWorkflows()

    // Enrich with execution data
    const enrichedWorkflows = await mapWithConcurrency(workflows, 8, async (workflow: any) => {
        const executions = await getWorkflowExecutions(workflow.id)
        const lastExecution = executions[0]
        const tags = normalizeTags(workflow.tags)
        
        return {
          id: workflow.id,
          name: workflow.name,
          description: tags.length ? tags.join(', ') : 'No description',
          status: workflow.active ? 'active' : 'paused',
          lastRun: lastExecution ? formatTimeAgo(new Date(lastExecution.startedAt)) : 'Never',
          runs: executions.length,
          category: tags[0] || 'General',
          executions: executions.slice(0, 5)
        }
      }
    )

    return NextResponse.json({ 
      workflows: enrichedWorkflows,
      source: 'n8n',
      count: enrichedWorkflows.length
    })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json({ 
      workflows: [],
      source: 'unavailable',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 502 })
  }
}

async function getAllWorkflows() {
  const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows?limit=250`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    console.error('n8n API error:', await response.text())
    throw new Error('Failed to fetch from n8n API')
  }

  const data = await response.json()
  return data.data || []
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  )

  return results
}

async function getWorkflowExecutions(workflowId: string) {
  try {
    const response = await fetch(
      `${N8N_BASE_URL}/api/v1/executions?workflowId=${workflowId}&limit=10`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) return []
    
    const data = await response.json()
    return data.data || []
  } catch {
    return []
  }
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []

  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag
      if (tag && typeof tag === 'object' && 'name' in tag) {
        const name = (tag as { name?: unknown }).name
        return typeof name === 'string' ? name : ''
      }
      return ''
    })
    .filter(Boolean)
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour ago`
  return `${diffDays} day ago`
}
