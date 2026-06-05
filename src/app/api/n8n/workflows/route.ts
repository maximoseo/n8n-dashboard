import { NextRequest, NextResponse } from 'next/server'

const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://websiseo.app.n8n.cloud'

export async function GET(request: NextRequest) {
  try {
    if (!N8N_API_KEY) {
      // Return mock data if no API key
      return NextResponse.json({ 
        workflows: getMockWorkflows(),
        source: 'mock'
      })
    }

    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('n8n API error:', await response.text())
      // Fallback to mock data
      return NextResponse.json({ 
        workflows: getMockWorkflows(),
        source: 'mock',
        error: 'Failed to fetch from n8n API'
      })
    }

    const data = await response.json()
    const workflows = data.data || []

    // Enrich with execution data
    const enrichedWorkflows = await Promise.all(
      workflows.map(async (workflow: any) => {
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
      })
    )

    return NextResponse.json({ 
      workflows: enrichedWorkflows,
      source: 'n8n',
      count: enrichedWorkflows.length
    })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json({ 
      workflows: getMockWorkflows(),
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
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

function getMockWorkflows() {
  return [
    {
      id: '1',
      name: 'URL Screenshot Pipeline',
      description: 'Captures responsive screenshots via Browserless',
      status: 'active',
      lastRun: '2 min ago',
      runs: 1247,
      category: 'URLs',
    },
    {
      id: '2',
      name: 'Parent ID Scanner',
      description: 'WordPress site scanning with validation',
      status: 'active',
      lastRun: '15 min ago',
      runs: 892,
      category: 'WordPress',
    },
    {
      id: '3',
      name: 'SERP Keyword Research',
      description: 'SERP analysis and competitor discovery',
      status: 'paused',
      lastRun: '1 hour ago',
      runs: 456,
      category: 'Research',
    },
    {
      id: '4',
      name: 'Cannibalization Checker',
      description: 'Overlap analysis and keyword conflict detection',
      status: 'active',
      lastRun: '30 min ago',
      runs: 234,
      category: 'Analysis',
    },
    {
      id: '5',
      name: 'Content Brief Generator',
      description: 'AI synthesis for content teams',
      status: 'active',
      lastRun: '5 min ago',
      runs: 678,
      category: 'Content',
    },
    {
      id: '6',
      name: 'Link Building Scorer',
      description: 'Quality scoring and risk assessment',
      status: 'error',
      lastRun: '3 hours ago',
      runs: 123,
      category: 'Links',
    },
  ]
}
