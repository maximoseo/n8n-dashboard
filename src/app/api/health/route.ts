import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'n8n-dashboard-v3',
    n8nConfigured: Boolean(process.env.N8N_API_KEY),
    timestamp: new Date().toISOString(),
  })
}
