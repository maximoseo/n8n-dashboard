import { NextResponse } from 'next/server'
import { n8nEnvHealth } from '@/lib/n8n/instances'

export const dynamic = 'force-dynamic'

export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    const n8n = n8nEnvHealth()

    return NextResponse.json({
      ok: true,
      service: 'n8n-dashboard-v3',
      n8nConfigured: n8n.configured > 0,
      n8nConfiguredInstances: n8n.configured,
      n8nTotalInstances: n8n.total,
      timestamp,
    })
  } catch (error) {
    console.error('Health check n8n env validation failed', error)

    return NextResponse.json(
      {
        ok: false,
        service: 'n8n-dashboard-v3',
        n8nConfigured: false,
        n8nConfiguredInstances: 0,
        n8nTotalInstances: 2,
        error: 'Invalid n8n monitoring configuration',
        timestamp,
      },
      { status: 500 }
    )
  }
}
