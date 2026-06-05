// Daily Monitoring Cron Job
// Checks workflow health and sends email alerts
// Trigger: Daily at 9 AM via Render Cron Job

import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/resend'

// n8n API configuration
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OGE3MmVjNi01YjAyLTQ1N2EtYWJiYy04OTU3MDI5NGRlZjkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZjA0OWY2MTQtNzYyYi00YzQyLTljNjctMGM0MWI1MDJiOGEwIiwiaWF0IjoxNzc4NDg0NjM5fQ.iiukVI9A_Y3GI0IZC9lskuq2duFKc5YHmj_rqs2qR5U'
const N8N_BASE_URL = 'https://websiseo.app.n8n.cloud'

interface Workflow {
  id: string
  name: string
  active: boolean
  tags?: string[]
  settings?: {
    schedule?: {
      interval: string
    }
  }
}

interface Execution {
  id: string
  workflowId: string
  status: 'success' | 'error' | 'running'
  startedAt: string
  finishedAt?: string
}

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'maximo-seo-cron-secret'
  
  if (!authHeader) return false
  return authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret
}

// Fetch all workflows from n8n
async function getWorkflows(): Promise<Workflow[]> {
  try {
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch workflows:', await response.text())
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return []
  }
}

// Fetch recent executions for a workflow
async function getWorkflowExecutions(workflowId: string, limit: number = 5): Promise<Execution[]> {
  try {
    const response = await fetch(
      `${N8N_BASE_URL}/api/v1/executions?workflowId=${workflowId}&limit=${limit}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch executions:', await response.text())
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching executions:', error)
    return []
  }
}

// Check if workflow should have run based on schedule
function shouldHaveRun(schedule: string | undefined, lastExecutionDate: Date | null): boolean {
  if (!schedule) return false // No schedule, manual trigger only
  if (!lastExecutionDate) return true // Never run, should check

  const now = new Date()
  const hoursSinceLastRun = (now.getTime() - lastExecutionDate.getTime()) / (1000 * 60 * 60)

  // Parse schedule interval (e.g., "1m", "5m", "1h", "1d")
  const match = schedule.match(/(\d+)([mdh])?/)
  if (!match) return false

  const value = parseInt(match[1])
  const unit = match[2] || 'm'

  let expectedIntervalHours = value
  switch (unit) {
    case 'm':
      expectedIntervalHours = value / 60
      break
    case 'h':
      expectedIntervalHours = value
      break
    case 'd':
      expectedIntervalHours = value * 24
      break
  }

  // Allow 25% buffer (e.g., 1h schedule can run every 75min)
  return hoursSinceLastRun > expectedIntervalHours * 1.25
}

// Main handler
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  console.log('🔔 Running daily workflow health check...')

  try {
    // Fetch all workflows
    const workflows = await getWorkflows()
    console.log(`📊 Found ${workflows.length} workflows`)

    const issues: Array<{ workflow: string; issue: string; lastRun?: string }> = []
    let totalRuns = 0

    // Check each workflow
    for (const workflow of workflows) {
      // Skip inactive workflows
      if (!workflow.active) continue

      // Get recent executions
      const executions = await getWorkflowExecutions(workflow.id, 5)
      
      // Count runs
      totalRuns += executions.length

      // Check last execution
      const lastExecution = executions[0]
      const lastExecutionDate = lastExecution ? new Date(lastExecution.startedAt) : null
      
      // Check for errors in recent runs
      const recentErrors = executions.filter(e => e.status === 'error')
      if (recentErrors.length >= 2) {
        issues.push({
          workflow: workflow.name,
          issue: `${recentErrors.length} recent failures`,
          lastRun: lastExecutionDate?.toLocaleString(),
        })
        continue
      }

      // Check if scheduled workflow missed a run
      const schedule = workflow.settings?.schedule?.interval
      if (schedule && shouldHaveRun(schedule, lastExecutionDate)) {
        issues.push({
          workflow: workflow.name,
          issue: `Missed scheduled run (expected: ${schedule})`,
          lastRun: lastExecutionDate?.toLocaleString(),
        })
      }
    }

    // Calculate stats
    const stats = {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.active).length,
      pausedWorkflows: workflows.filter(w => !w.active).length,
      errorWorkflows: issues.length,
      totalRuns,
    }

    console.log(`⚠️ Found ${issues.length} issues`)

    // Send email if there are issues
    if (issues.length > 0) {
      const alertEmail = emailTemplates.workflowAlert(issues)
      const result = await sendEmail({
        to: process.env.ALERT_EMAIL || 'service@maximo-seo.com',
        subject: alertEmail.subject,
        html: alertEmail.html,
        from: 'alerts@maximo-seo.ai',
      })

      if (result.success) {
        console.log('📧 Alert email sent:', result.id)
      } else {
        console.error('❌ Failed to send alert email:', result.error)
      }
    }

    // Always send daily summary
    const summaryEmail = emailTemplates.dailySummary(stats)
    const summaryResult = await sendEmail({
      to: process.env.ALERT_EMAIL || 'service@maximo-seo.com',
      subject: summaryEmail.subject,
      html: summaryEmail.html,
      from: 'summary@maximo-seo.ai',
    })

    if (summaryResult.success) {
      console.log('📧 Summary email sent:', summaryResult.id)
    } else {
      console.error('❌ Failed to send summary email:', summaryResult.error)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      issues: issues.length,
      emailsSent: {
        alert: issues.length > 0,
        summary: summaryResult.success,
      },
    })

  } catch (error) {
    console.error('❌ Daily check failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
