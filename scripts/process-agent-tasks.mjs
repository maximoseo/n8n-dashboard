import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const WORKFLOW_ID = process.env.AGENT_TASKS_N8N_WORKFLOW_ID || 'NUhVms7giXzkdMPM'
const STATE_PATH = process.env.AGENT_TASKS_STATE_PATH || '/root/.openclaw/state/n8n-dashboard-agent-tasks.json'
const ENV_PATH = process.env.AGENT_TOOLS_ENV || '/root/.openclaw/secrets/agent-tools.env'

loadEnvFile(ENV_PATH)

const n8nBaseUrl = process.env.N8N_BASE_URL || 'https://websiseo.app.n8n.cloud'
const n8nApiKey = process.env.N8N_API_KEY

if (!n8nApiKey) {
  throw new Error('N8N_API_KEY is required')
}

const state = readState()
const executions = await n8n(`/api/v1/executions?workflowId=${WORKFLOW_ID}&limit=20`)
const processed = new Set(state.processedExecutionIds || [])
const newest = []

for (const execution of [...(executions.data || [])].reverse()) {
  if (processed.has(execution.id)) continue
  if (execution.status !== 'success') continue

  const detail = await n8n(`/api/v1/executions/${execution.id}?includeData=true`)
  const task = extractTask(detail)
  if (!task?.taskId || !Array.isArray(task.agents)) {
    processed.add(execution.id)
    newest.push(execution.id)
    continue
  }

  for (const agent of task.agents) {
    if (!agent?.name) continue
    createMulticaIssue(task, agent, execution.id)
  }

  processed.add(execution.id)
  newest.push(execution.id)
}

writeState({
  processedExecutionIds: Array.from(processed).slice(-200),
  lastRunAt: new Date().toISOString(),
  lastProcessedExecutionIds: newest,
})

if (newest.length) {
  console.log(`Processed ${newest.length} dashboard agent task execution(s): ${newest.join(', ')}`)
} else {
  console.log('No new dashboard agent tasks to process')
}

async function n8n(path) {
  const response = await fetch(`${n8nBaseUrl}${path}`, {
    headers: {
      'X-N8N-API-KEY': n8nApiKey,
      Accept: 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`n8n API failed: ${response.status}`)
  }
  return response.json()
}

function extractTask(execution) {
  const runData = execution.data?.resultData?.runData || {}
  const webhookRun = runData['Agent Task Webhook']?.[0]
  return webhookRun?.data?.main?.[0]?.[0]?.json?.body
}

function createMulticaIssue(task, agent, executionId) {
  const shortAgentName = String(agent.name).replace(/^OpenClaw64\s+/, '')
  const title = `[Dashboard:${shortAgentName}] ${task.title}`.slice(0, 140)
  const description = [
    `Task ID: ${task.taskId}`,
    `n8n execution: ${executionId}`,
    `Priority: ${task.priority || 'normal'}`,
    `Repo: ${task.repoPath || '/root/work/n8n-dashboard'}`,
    `Production: ${task.productionUrl || 'https://n8n-dashboard-v3.onrender.com'}`,
    '',
    'Brief:',
    task.brief,
    '',
    'Success criteria:',
    '- Work only within the requested scope.',
    '- Do not expose secrets.',
    '- Verify with real commands/browser/API checks where relevant.',
    '- Report concise findings and any blockers.',
  ].join('\n')

  execFileSync('multica', [
    'issue',
    'create',
    '--title',
    title,
    '--assignee',
    agent.name,
    '--description',
    description,
  ], { stdio: 'inherit' })
}

function readState() {
  if (!existsSync(STATE_PATH)) return {}
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function writeState(nextState) {
  mkdirSync(dirname(STATE_PATH), { recursive: true })
  writeFileSync(STATE_PATH, JSON.stringify(nextState, null, 2))
}

function loadEnvFile(path) {
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index)
    const value = trimmed.slice(index + 1).replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}
