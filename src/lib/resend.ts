// Resend Email API Integration
// Set RESEND_API_KEY in environment variables

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
  }>
}

export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean
  id?: string
  error?: string
}> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'alerts@maximo-seo.ai',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        ...(options.cc && { cc: options.cc }),
        ...(options.bcc && { bcc: options.bcc }),
        ...(options.replyTo && { reply_to: options.replyTo }),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Resend API error: ${error}` }
    }

    const data = await response.json()
    return { success: true, id: data.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function sendBatchEmails(
  emails: EmailOptions[]
): Promise<Array<{ success: boolean; id?: string; error?: string }>> {
  const results = await Promise.all(emails.map(sendEmail))
  return results
}

// Pre-defined email templates
export const emailTemplates = {
  workflowAlert: (issues: Array<{ workflow: string; issue: string; lastRun?: string }>) => ({
    subject: `⚠️ Workflow Issues Detected - ${issues.length} workflow(s) need attention`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 8px; overflow: hidden; }
    .header { background: #3b82f6; padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: white; font-size: 20px; }
    .content { padding: 24px; }
    .issue { background: #334155; border-left: 4px solid #ef4444; padding: 16px; margin: 12px 0; border-radius: 4px; }
    .issue h3 { margin: 0 0 8px 0; color: #fca5a5; }
    .issue p { margin: 0; color: #94a3b8; font-size: 14px; }
    .footer { padding: 16px 24px; background: #0f172a; text-align: center; font-size: 12px; color: #64748b; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 n8n Dashboard Alert</h1>
    </div>
    <div class="content">
      <p>We detected issues with ${issues.length} workflow(s) that require your attention:</p>
      ${issues.map(issue => `
        <div class="issue">
          <h3>${issue.workflow}</h3>
          <p><strong>Issue:</strong> ${issue.issue}</p>
          ${issue.lastRun ? `<p><strong>Last Run:</strong> ${issue.lastRun}</p>` : ''}
        </div>
      `).join('')}
      <a href="https://n8n-dashboard-v3.onrender.com" class="button">View Dashboard</a>
    </div>
    <div class="footer">
      <p>This is an automated alert from n8n Dashboard - MaximoSEO</p>
      <p>Service: service@maximo-seo.com</p>
    </div>
  </div>
</body>
</html>
    `,
  }),

  dailySummary: (stats: {
    totalWorkflows: number
    activeWorkflows: number
    pausedWorkflows: number
    errorWorkflows: number
    totalRuns: number
  }) => ({
    subject: '📊 Daily n8n Dashboard Summary',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 8px; overflow: hidden; }
    .header { background: #10b981; padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: white; font-size: 20px; }
    .content { padding: 24px; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; }
    .stat { background: #334155; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
    .stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    .footer { padding: 16px 24px; background: #0f172a; text-align: center; font-size: 12px; color: #64748b; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Workflow Summary</h1>
    </div>
    <div class="content">
      <p>Here's your daily summary for the n8n dashboard:</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${stats.totalWorkflows}</div>
          <div class="stat-label">Total Workflows</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #10b981;">${stats.activeWorkflows}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #f59e0b;">${stats.pausedWorkflows}</div>
          <div class="stat-label">Paused</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #ef4444;">${stats.errorWorkflows}</div>
          <div class="stat-label">Errors</div>
        </div>
      </div>
      <p style="text-align: center; color: #94a3b8;">Total runs today: <strong style="color: white;">${stats.totalRuns.toLocaleString()}</strong></p>
      <a href="https://n8n-dashboard-v3.onrender.com" class="button">View Dashboard</a>
    </div>
    <div class="footer">
      <p>n8n Dashboard - MaximoSEO</p>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
</body>
</html>
    `,
  }),
}
