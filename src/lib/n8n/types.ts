/** Normalized dashboard-facing n8n types + loose raw API shapes. */

export type ExecutionStatus =
  | 'success'
  | 'error'
  | 'running'
  | 'waiting'
  | 'canceled'
  | 'unknown'

// --- Raw (loosely typed; n8n REST v1) ---
export interface RawWorkflow {
  id: string
  name: string
  active?: boolean
  tags?: Array<{ name?: string } | string>
  triggerCount?: number
  createdAt?: string
  updatedAt?: string
  nodes?: Array<{ type?: string }>
}

export interface RawExecution {
  id: string | number
  workflowId?: string
  finished?: boolean
  mode?: string
  status?: string
  startedAt?: string
  stoppedAt?: string
}

// --- Normalized ---
export interface NormalizedWorkflow {
  n8nWorkflowId: string
  name: string
  active: boolean
  tags: string[]
  triggerType: string
  triggerCount: number
  createdAt: string | null
  updatedAt: string | null
}

export interface NormalizedExecution {
  n8nExecutionId: string
  n8nWorkflowId: string
  status: ExecutionStatus
  mode: string | null
  startedAt: string | null
  finishedAt: string | null
  durationMs: number | null
  errorFingerprint: string | null
}

export interface WorkflowMetrics {
  totalExecutions: number
  successRate24h: number | null
  successRate7d: number | null
  avgDurationMs: number | null
  p95DurationMs: number | null
  lastExecutionId: string | null
  lastExecutionStatus: ExecutionStatus | null
  lastExecutionAtMs: number | null
}
