export const CODING_AGENTS = [
  {
    id: 'openclaw64-claude',
    name: 'OpenClaw64 Claude',
    role: 'Architecture, complex code, refactors',
  },
  {
    id: 'openclaw64-codex',
    name: 'OpenClaw64 Codex',
    role: 'Fast implementation and focused fixes',
  },
  {
    id: 'openclaw64-opencode',
    name: 'OpenClaw64 OpenCode',
    role: 'Review, debugging, code analysis',
  },
  {
    id: 'openclaw64-openclaw',
    name: 'OpenClaw64 OpenClaw',
    role: 'Orchestration, tools, verification',
  },
  {
    id: 'openclaw64-kiro',
    name: 'OpenClaw64 Kiro',
    role: 'Creative/content/product drafting',
  },
] as const

export type CodingAgentId = typeof CODING_AGENTS[number]['id']

export type AgentTaskPriority = 'normal' | 'high' | 'urgent'

export interface AgentTaskRequest {
  title: string
  brief: string
  agents: CodingAgentId[]
  priority: AgentTaskPriority
  repoPath?: string
  productionUrl?: string
}

export function buildAgentTaskId() {
  return `agent-task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function validateAgentTask(raw: unknown): AgentTaskRequest {
  const input = raw as Partial<AgentTaskRequest>
  const title = input.title?.trim()
  const brief = input.brief?.trim()
  const agents = Array.isArray(input.agents) ? input.agents : []
  const validAgentIds = new Set(CODING_AGENTS.map((agent) => agent.id))
  const selectedAgents = agents.filter((agent): agent is CodingAgentId => validAgentIds.has(agent as CodingAgentId))
  const priority = input.priority || 'normal'

  if (!title) throw new Error('Task title is required')
  if (!brief || brief.length < 20) throw new Error('Task brief must be at least 20 characters')
  if (selectedAgents.length === 0) throw new Error('Select at least one coding agent')
  if (!['normal', 'high', 'urgent'].includes(priority)) throw new Error('Invalid priority')

  return {
    title: title.slice(0, 140),
    brief: brief.slice(0, 5000),
    agents: selectedAgents,
    priority,
    repoPath: input.repoPath?.trim().slice(0, 240) || '/root/work/n8n-dashboard',
    productionUrl: input.productionUrl?.trim().slice(0, 240) || 'https://n8n-dashboard-v3.onrender.com',
  }
}
