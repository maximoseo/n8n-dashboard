import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import {
  NofollowCloneRequest,
  buildSheetSeed,
  buildSheetTitle,
  buildWorkflowClonePayload,
  normalizeSiteUrl,
} from '@/lib/nofollow-clone'

const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://websiseo.app.n8n.cloud'
const SETUP_WEBHOOK_URL = process.env.N8N_NOFOLLOW_SETUP_WEBHOOK_URL || ''

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request)
    if (auth.response) return auth.response

    const input = validateInput(await request.json())

    if (!N8N_API_KEY) {
      return NextResponse.json({ error: 'n8n API key is not configured' }, { status: 503 })
    }

    const sourceWorkflow = input.sourceWorkflowId
      ? await getWorkflow(input.sourceWorkflowId)
      : await findNofollowWorkflow()

    if (!sourceWorkflow) {
      return NextResponse.json({
        error: 'No Nofollow source workflow was found. Select a source workflow first.',
      }, { status: 404 })
    }

    const sheet = await createNofollowSheet(input)
    const clonePayload = buildWorkflowClonePayload(sourceWorkflow, input, sheet)
    const createdWorkflow = await createWorkflow(clonePayload)

    if (input.activate) {
      await setWorkflowActive(createdWorkflow.id, true)
    }

    return NextResponse.json({
      source: 'n8n',
      workflow: {
        id: createdWorkflow.id,
        name: createdWorkflow.name,
        active: Boolean(input.activate),
        url: `${N8N_BASE_URL}/workflow/${createdWorkflow.id}`,
      },
      sheet,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Nofollow clone error'
    const status = /configured|credential|private key|service account/i.test(message) ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

function validateInput(raw: unknown): NofollowCloneRequest {
  const input = raw as Partial<NofollowCloneRequest>
  const siteName = input.siteName?.trim()
  const siteUrl = input.siteUrl?.trim()
  const keyword = input.keyword?.trim()

  if (!siteName) throw new Error('Site name is required')
  if (!siteUrl) throw new Error('Site URL is required')
  if (!keyword) throw new Error('Primary keyword is required')

  return {
    sourceWorkflowId: input.sourceWorkflowId?.trim() || undefined,
    sourceDomain: input.sourceDomain?.trim() || undefined,
    siteName,
    siteUrl: normalizeSiteUrl(siteUrl),
    keyword,
    location: input.location?.trim() || undefined,
    sheetTitle: input.sheetTitle?.trim() || undefined,
    activate: Boolean(input.activate),
  }
}

async function findNofollowWorkflow() {
  const response = await n8nFetch('/api/v1/workflows?limit=250')
  const data = await response.json()
  const workflows = Array.isArray(data.data) ? data.data : []
  const source = workflows.find((workflow: any) => /nofollow/i.test(workflow?.name || ''))
  return source ? getWorkflow(source.id) : null
}

async function getWorkflow(id: string) {
  const response = await n8nFetch(`/api/v1/workflows/${encodeURIComponent(id)}`)
  return response.json()
}

async function createWorkflow(payload: Record<string, unknown>) {
  const response = await n8nFetch('/api/v1/workflows', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.json()
}

async function setWorkflowActive(id: string, active: boolean) {
  const action = active ? 'activate' : 'deactivate'
  await n8nFetch(`/api/v1/workflows/${encodeURIComponent(id)}/${action}`, {
    method: 'POST',
  })
}

async function n8nFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${N8N_BASE_URL}${path}`, {
    ...init,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`n8n API failed: ${response.status} ${text.slice(0, 300)}`)
  }

  return response
}

async function createNofollowSheet(input: NofollowCloneRequest) {
  if (SETUP_WEBHOOK_URL) {
    return createSheetViaWebhook(input)
  }

  return createSheetViaServiceAccount(input)
}

async function createSheetViaWebhook(input: NofollowCloneRequest) {
  const response = await fetch(SETUP_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      sheetTitle: buildSheetTitle(input),
      seed: buildSheetSeed(input),
    }),
  })

  if (!response.ok) {
    throw new Error(`Nofollow setup webhook failed: ${response.status}`)
  }

  const data = await response.json()
  if (!data.spreadsheetId || !data.spreadsheetUrl) {
    throw new Error('Nofollow setup webhook did not return spreadsheetId and spreadsheetUrl')
  }

  return {
    spreadsheetId: String(data.spreadsheetId),
    spreadsheetUrl: String(data.spreadsheetUrl),
    createdBy: 'webhook',
  }
}

async function createSheetViaServiceAccount(input: NofollowCloneRequest) {
  const credentials = getGoogleServiceAccount()
  const accessToken = await getGoogleAccessToken(credentials)
  const seed = buildSheetSeed(input)
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: buildSheetTitle(input) },
      sheets: seed.map((sheet) => ({ properties: { title: sheet.title } })),
    }),
  })

  if (!createResponse.ok) {
    throw new Error(`Google Sheets create failed: ${createResponse.status}`)
  }

  const spreadsheet = await createResponse.json()
  const spreadsheetId = spreadsheet.spreadsheetId
  const spreadsheetUrl = spreadsheet.spreadsheetUrl

  const valuesResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: seed.map((sheet) => ({
          range: `'${sheet.title}'!A1`,
          values: sheet.values,
        })),
      }),
    },
  )

  if (!valuesResponse.ok) {
    throw new Error(`Google Sheets seed failed: ${valuesResponse.status}`)
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    createdBy: 'service-account',
  }
}

function getGoogleServiceAccount() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (json) {
    const parsed = JSON.parse(json)
    if (parsed.client_email && parsed.private_key) {
      return {
        clientEmail: String(parsed.client_email),
        privateKey: String(parsed.private_key),
      }
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets creation is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or N8N_NOFOLLOW_SETUP_WEBHOOK_URL.')
  }

  return { clientEmail, privateKey }
}

async function getGoogleAccessToken(credentials: { clientEmail: string; privateKey: string }) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64Url(JSON.stringify({
    iss: credentials.clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }))
  const unsigned = `${header}.${claim}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(unsigned)
  const signature = base64Url(signer.sign(credentials.privateKey))

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Google service account token failed: ${response.status}`)
  }

  const data = await response.json()
  return String(data.access_token)
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}
