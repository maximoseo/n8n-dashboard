import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'

const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://websiseo.app.n8n.cloud'
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || ''
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const N8N_NOFOLLOW_SETUP_WEBHOOK_URL = process.env.N8N_NOFOLLOW_SETUP_WEBHOOK_URL || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

export const dynamic = 'force-dynamic'

type IntegrationStatus = {
  name: string
  status: 'connected' | 'not_connected'
  detail: string
  checkedAt: string
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response

  const checkedAt = new Date().toISOString()
  const [n8n, browserless, firecrawl, googleSheets, openai] = await Promise.all([
    checkN8n(checkedAt),
    checkBrowserless(checkedAt),
    checkFirecrawl(checkedAt),
    checkGoogleSheetsSetup(checkedAt),
    checkConfigured('OpenAI API', OPENAI_API_KEY, 'Server-side key configured', checkedAt),
  ])

  return NextResponse.json({
    integrations: [n8n, browserless, firecrawl, googleSheets, openai],
    checkedAt,
  })
}

async function checkN8n(checkedAt: string): Promise<IntegrationStatus> {
  if (!N8N_API_KEY) {
    return disconnected('n8n API', 'API key is not configured', checkedAt)
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows?limit=1`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        Accept: 'application/json',
      },
    })
    if (!response.ok) return disconnected('n8n API', `Live check failed: ${response.status}`, checkedAt)

    const data = await response.json().catch(() => null)
    const count = typeof data?.nextCursor === 'string' ? '1+' : `${data?.data?.length || 0}`
    return connected('n8n API', `Live API reachable, returned ${count} workflow record(s)`, checkedAt)
  } catch (error) {
    return disconnected('n8n API', errorMessage(error), checkedAt)
  }
}

async function checkBrowserless(checkedAt: string): Promise<IntegrationStatus> {
  if (!BROWSERLESS_API_KEY) {
    return disconnected('Browserless', 'API key is not configured', checkedAt)
  }

  try {
    const response = await fetch(`https://chrome.browserless.io/json/version?token=${BROWSERLESS_API_KEY}`)
    if (!response.ok) return disconnected('Browserless', `Live check failed: ${response.status}`, checkedAt)

    const data = await response.json().catch(() => null)
    return connected('Browserless', data?.Browser ? `Live Chrome ${data.Browser}` : 'Live browser endpoint reachable', checkedAt)
  } catch (error) {
    return disconnected('Browserless', errorMessage(error), checkedAt)
  }
}

async function checkFirecrawl(checkedAt: string): Promise<IntegrationStatus> {
  if (!FIRECRAWL_API_KEY) {
    return disconnected('Firecrawl', 'API key is not configured', checkedAt)
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        formats: ['markdown'],
      }),
    })
    if (!response.ok) return disconnected('Firecrawl', `Live scrape failed: ${response.status}`, checkedAt)

    const data = await response.json().catch(() => null)
    const title = data?.data?.metadata?.title
    return connected('Firecrawl', title ? `Live scrape reachable: ${title}` : 'Live scrape endpoint reachable', checkedAt)
  } catch (error) {
    return disconnected('Firecrawl', errorMessage(error), checkedAt)
  }
}

async function checkGoogleSheetsSetup(checkedAt: string): Promise<IntegrationStatus> {
  return checkConfigured(
    'Google Sheets',
    N8N_NOFOLLOW_SETUP_WEBHOOK_URL,
    'Sheet creation is connected through the n8n setup webhook',
    checkedAt
  )
}

async function checkConfigured(name: string, value: string, detail: string, checkedAt: string): Promise<IntegrationStatus> {
  return value ? connected(name, detail, checkedAt) : disconnected(name, 'Server-side configuration is missing', checkedAt)
}

function connected(name: string, detail: string, checkedAt: string): IntegrationStatus {
  return { name, status: 'connected', detail, checkedAt }
}

function disconnected(name: string, detail: string, checkedAt: string): IntegrationStatus {
  return { name, status: 'not_connected', detail, checkedAt }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Live check failed'
}
