import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { buildAgentTaskId, CODING_AGENTS, validateAgentTask } from '@/lib/agent-tasks'

const AGENT_TASKS_WEBHOOK_URL = process.env.AGENT_TASKS_WEBHOOK_URL || ''
const AGENT_TASKS_WEBHOOK_SECRET = process.env.AGENT_TASKS_WEBHOOK_SECRET || ''

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request)
    if (auth.response) return auth.response

    const input = validateAgentTask(await request.json())
    if (!AGENT_TASKS_WEBHOOK_URL) {
      return NextResponse.json({
        error: 'Agent task bridge is not configured',
        detail: 'Set AGENT_TASKS_WEBHOOK_URL on the server to submit real coding-agent tasks.',
      }, { status: 503 })
    }

    const taskId = buildAgentTaskId()
    const payload = {
      taskId,
      ...input,
      agents: input.agents.map((agentId) => CODING_AGENTS.find((agent) => agent.id === agentId)),
      submittedBy: auth.user?.email || auth.user?.id || 'authenticated-user',
      submittedAt: new Date().toISOString(),
      source: 'n8n-dashboard-agent-tasks',
    }
    const body = JSON.stringify(payload)

    const response = await fetch(AGENT_TASKS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AGENT_TASKS_WEBHOOK_SECRET ? { 'X-Agent-Task-Signature': signBody(body) } : {}),
      },
      body,
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json({
        error: 'Agent task bridge rejected the request',
        detail: data?.error || data?.message || `HTTP ${response.status}`,
      }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      taskId: data?.taskId || taskId,
      status: data?.status || 'accepted',
      bridge: data?.bridge || 'agent-task-webhook',
      submittedAt: payload.submittedAt,
      agents: payload.agents,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Agent task submission failed',
    }, { status: 400 })
  }
}

function signBody(body: string) {
  return crypto
    .createHmac('sha256', AGENT_TASKS_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
}
