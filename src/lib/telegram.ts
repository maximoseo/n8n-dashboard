// Telegram Bot API Integration
// Set TELEGRAM_BOT_TOKEN in environment variables

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

export interface TelegramMessage {
  chat_id: string | number
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disable_notification?: boolean
}

// Send message to Telegram
export async function sendTelegramMessage(
  message: TelegramMessage
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Telegram API error: ${error}` }
    }

    const data = await response.json()
    if (!data.ok) {
      return { success: false, error: data.description }
    }

    return { success: true, messageId: data.result?.message_id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Send alert notification
export async function sendAlertNotification(
  chatId: string,
  issue: { workflow: string; type: string; details: string }
): Promise<{ success: boolean; error?: string }> {
  const emoji = issue.type === 'error' ? '🚨' : issue.type === 'warning' ? '⚠️' : 'ℹ️'
  
  const text = `${emoji} <b>Workflow Alert</b>

<b>Workflow:</b> ${escapeHtml(issue.workflow)}
<b>Type:</b> ${escapeHtml(issue.type.toUpperCase())}
<b>Details:</b> ${escapeHtml(issue.details)}

<a href="https://n8n-dashboard-v3.onrender.com">View Dashboard</a>

<em>Sent: ${new Date().toLocaleString()}</em>`

  return sendTelegramMessage({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  })
}

// Send daily summary
export async function sendDailySummary(
  chatId: string,
  stats: {
    totalWorkflows: number
    activeWorkflows: number
    pausedWorkflows: number
    errorWorkflows: number
    totalRuns: number
  }
): Promise<{ success: boolean; error?: string }> {
  const text = `📊 <b>Daily Workflow Summary</b>

<b>Overview:</b>
• Total Workflows: ${stats.totalWorkflows}
• Active: ${stats.activeWorkflows} ✅
• Paused: ${stats.pausedWorkflows} ⏸
• Errors: ${stats.errorWorkflows} ${stats.errorWorkflows > 0 ? '❌' : '✅'}

<b>Activity:</b>
• Total Runs Today: ${stats.totalRuns.toLocaleString()}

${stats.errorWorkflows > 0 
  ? `⚠️ <b>${stats.errorWorkflows} workflow(s) need attention!</b>` 
  : '✅ All systems operational'}

<a href="https://n8n-dashboard-v3.onrender.com">Open Dashboard</a>

<em>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</em>`

  return sendTelegramMessage({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_notification: stats.errorWorkflows === 0, // Silent if all OK
  })
}

// Send workflow status update
export async function sendWorkflowStatus(
  chatId: string,
  workflow: {
    name: string
    status: 'active' | 'paused' | 'error'
    lastRun?: string
    runs?: number
  }
): Promise<{ success: boolean; error?: string }> {
  const statusEmoji = {
    active: '🟢',
    paused: '🟡',
    error: '🔴',
  }

  const text = `${statusEmoji[workflow.status]} <b>${escapeHtml(workflow.name)}</b>

<b>Status:</b> ${workflow.status.toUpperCase()}
${workflow.lastRun ? `<b>Last Run:</b> ${workflow.lastRun}\n` : ''}
${workflow.runs ? `<b>Total Runs:</b> ${workflow.runs.toLocaleString()}\n` : ''}

<a href="https://websiseo.app.n8n.cloud">Open in n8n</a>`

  return sendTelegramMessage({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  })
}

// Get bot info
export async function getBotInfo(): Promise<{
  success: boolean
  info?: {
    id: number
    first_name: string
    username: string
    can_join_groups?: boolean
    can_read_all_group_messages?: boolean
  }
  error?: string
}> {
  try {
    const response = await fetch(`${BASE_URL}/getMe`)
    const data = await response.json()

    if (!data.ok) {
      return { success: false, error: data.description }
    }

    return { success: true, info: data.result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Set webhook for receiving updates
export async function setWebhook(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    const data = await response.json()
    
    if (!data.ok) {
      return { success: false, error: data.description }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Delete webhook
export async function deleteWebhook(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/deleteWebhook`, {
      method: 'POST',
    })

    const data = await response.json()
    
    if (!data.ok) {
      return { success: false, error: data.description }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Handle incoming Telegram commands (for webhook)
export async function handleTelegramCommand(
  update: any
): Promise<{ success: boolean; response?: string; error?: string }> {
  if (!update.message?.text) {
    return { success: false, error: 'No message text' }
  }

  const text = update.message.text as string
  const chatId = update.message.chat.id

  // Parse command
  const command = text.split(' ')[0].toLowerCase()

  switch (command) {
    case '/start':
    case '/help':
      return {
        success: true,
        response: `🤖 <b>n8n Dashboard Bot</b>

Available commands:
/status - Get overall dashboard status
/workflows - List all workflows
/alert - Check recent alerts
/help - Show this help message

You'll receive automatic notifications for:
• Workflow errors
• Daily summaries
• System alerts`,
      }

    case '/status':
      return {
        success: true,
        response: `📊 Use the web dashboard for full status:
https://n8n-dashboard-v3.onrender.com`,
      }

    case '/workflows':
      return {
        success: true,
        response: `🔄 View all workflows:
https://n8n-dashboard-v3.onrender.com`,
      }

    case '/alert':
      return {
        success: true,
        response: `⚠️ Alerts are sent automatically when issues are detected.

Last check: ${new Date().toLocaleString()}`,
      }

    default:
      return {
        success: true,
        response: `❓ Unknown command. Use /help for available commands.`,
      }
  }
}

// Helper function to escape HTML for Telegram
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Get updates (for polling)
export async function getUpdates(offset?: number): Promise<{
  success: boolean
  updates?: any[]
  error?: string
}> {
  try {
    const url = offset 
      ? `${BASE_URL}/getUpdates?offset=${offset}` 
      : `${BASE_URL}/getUpdates`
    
    const response = await fetch(url)
    const data = await response.json()

    if (!data.ok) {
      return { success: false, error: data.description }
    }

    return { success: true, updates: data.result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
