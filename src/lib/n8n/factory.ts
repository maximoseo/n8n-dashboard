import { serverEnv } from '@/lib/env'
import { N8nClient } from './client'

/** Construct the server-side n8n client from env, or null if unconfigured. */
export function getN8nClient(): N8nClient | null {
  if (!serverEnv.N8N_API_KEY) return null
  return new N8nClient({ baseUrl: serverEnv.N8N_BASE_URL, apiKey: serverEnv.N8N_API_KEY })
}
