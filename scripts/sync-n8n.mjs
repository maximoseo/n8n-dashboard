#!/usr/bin/env node
/**
 * Machine-triggered n8n sync (cron / CI / manual).
 *
 * Thin client: POSTs to the app's /api/n8n/sync route using the shared
 * SYNC_SECRET, so the sync logic stays in one place (src/lib/n8n/sync.ts).
 *
 * Required env:
 *   APP_BASE_URL   default http://localhost:3000
 *   SYNC_SECRET    must match the running server's SYNC_SECRET
 *
 * Usage: npm run sync:n8n
 */
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000'
const SYNC_SECRET = process.env.SYNC_SECRET || ''

async function main() {
  if (!SYNC_SECRET) {
    console.error('SYNC_SECRET is not set. Refusing to call the sync endpoint without it.')
    process.exit(2)
  }

  const url = `${APP_BASE_URL.replace(/\/$/, '')}/api/n8n/sync`
  const started = Date.now()
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'x-sync-secret': SYNC_SECRET, 'content-type': 'application/json' },
    })
  } catch (err) {
    console.error(`Failed to reach ${url}:`, err?.message || err)
    process.exit(1)
  }

  const body = await res.json().catch(() => ({}))
  const elapsed = Date.now() - started
  // body never contains secrets — safe to print.
  console.log(`[sync-n8n] ${res.status} in ${elapsed}ms`, JSON.stringify(body))

  if (!res.ok || body.ok === false) process.exit(1)
}

main()
