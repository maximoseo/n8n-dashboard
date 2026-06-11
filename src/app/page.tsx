import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Dashboard } from '@/components/dashboard'
import { HomeAuthGate } from '@/components/home-auth-gate'
import { hasValidSeoAuditBridgeHeader, isSeoAuditBridgeRequired } from '@/lib/server-auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  if (isSeoAuditBridgeRequired()) {
    const requestHeaders = await headers()
    if (!hasValidSeoAuditBridgeHeader(requestHeaders)) {
      notFound()
    }
    return <Dashboard />
  }

  return <HomeAuthGate />
}
