/**
 * Server-only n8n REST API client (read-only for this slice).
 *
 * - Enforces an allowlist of known n8n hosts.
 * - Per-request timeout via AbortController.
 * - Retries on transient failures for GET (idempotent) only.
 * - Never to be imported into client components.
 */
import type { RawExecution, RawWorkflow } from './types'

/** Known, trusted n8n instances. Reject anything else to avoid SSRF. */
export const ALLOWED_N8N_HOSTS = ['websiseo.app.n8n.cloud', 'maximoseo.app.n8n.cloud']

const DEFAULT_TIMEOUT_MS = 15_000
const GET_RETRIES = 2

export interface N8nClientConfig {
  baseUrl: string
  apiKey: string
  timeoutMs?: number
}

export class N8nClient {
  private base: string
  private apiKey: string
  private timeoutMs: number

  constructor(cfg: N8nClientConfig) {
    const url = new URL(cfg.baseUrl)
    if (!ALLOWED_N8N_HOSTS.includes(url.host)) {
      throw new Error(`n8n host not allowed: ${url.host}`)
    }
    if (!cfg.apiKey) throw new Error('n8n API key is required')
    this.base = `${url.protocol}//${url.host}`
    this.apiKey = cfg.apiKey
    this.timeoutMs = cfg.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  get host(): string {
    return new URL(this.base).host
  }

  private async getJson<T>(path: string): Promise<T> {
    let lastErr: unknown
    for (let attempt = 0; attempt <= GET_RETRIES; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const res = await fetch(`${this.base}${path}`, {
          headers: { 'X-N8N-API-KEY': this.apiKey, Accept: 'application/json' },
          signal: controller.signal,
        })
        if (res.status >= 500) throw new Error(`n8n ${res.status}`)
        if (!res.ok) {
          const body = await res.text().catch(() => '')
          throw new Error(`n8n request failed ${res.status}: ${body.slice(0, 200)}`)
        }
        return (await res.json()) as T
      } catch (err) {
        lastErr = err
        // Only retry on transient/network/5xx; back off briefly.
        if (attempt < GET_RETRIES) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
          continue
        }
      } finally {
        clearTimeout(timer)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('n8n request failed')
  }

  /** List workflows (paginated by n8n; we pull up to `limit`). */
  async listWorkflows(limit = 250): Promise<RawWorkflow[]> {
    const data = await this.getJson<{ data?: RawWorkflow[] }>(
      `/api/v1/workflows?limit=${limit}`
    )
    return data.data ?? []
  }

  /** Recent executions for a workflow (newest first per n8n). */
  async listExecutions(workflowId: string, limit = 20): Promise<RawExecution[]> {
    try {
      const data = await this.getJson<{ data?: RawExecution[] }>(
        `/api/v1/executions?workflowId=${encodeURIComponent(workflowId)}&limit=${limit}`
      )
      return data.data ?? []
    } catch {
      return []
    }
  }

  /** Full workflow JSON (used for export / docs / clone). Read-only. */
  async getWorkflow(id: string): Promise<Record<string, unknown>> {
    return this.getJson<Record<string, unknown>>(`/api/v1/workflows/${encodeURIComponent(id)}`)
  }

  /**
   * Activate or deactivate a workflow. HIGH-RISK production mutation — callers
   * MUST gate this behind explicit confirmation + reason + audit. Not retried.
   */
  async setActive(id: string, active: boolean): Promise<Record<string, unknown>> {
    const path = `/api/v1/workflows/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(`${this.base}${path}`, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': this.apiKey, Accept: 'application/json' },
        signal: controller.signal,
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`n8n ${active ? 'activate' : 'deactivate'} failed ${res.status}: ${body.slice(0, 200)}`)
      }
      return (await res.json()) as Record<string, unknown>
    } finally {
      clearTimeout(timer)
    }
  }

  /** Lightweight reachability probe used by the sync status card. */
  async ping(): Promise<boolean> {
    try {
      await this.getJson('/api/v1/workflows?limit=1')
      return true
    } catch {
      return false
    }
  }
}

/** Run an async mapper over items with bounded concurrency. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await mapper(items[i], i)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), items.length || 1) }, worker)
  )
  return results
}
