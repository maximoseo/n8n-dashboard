import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { generateAIContent } from '@/lib/ai'
import { buildFailureAnalysisPrompt } from '@/lib/ai-prompts'
import { redactAll } from '@/lib/redaction'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * AI failure analysis for an error cluster. The cluster summary is redacted
 * before reaching the model; only minimal, non-sensitive context is sent.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const userId = auth.user?.id ?? auth.user?.sub ?? null

  const body = await request.json().catch(() => ({}))
  const summary = {
    workflowName: String(redactAll(String(body?.workflowName ?? 'unknown'))),
    occurrences: Number(body?.occurrences) || 0,
    affectedWorkflows: Number(body?.affectedWorkflows) || 0,
    lastSeen: typeof body?.lastSeen === 'string' ? body.lastSeen : null,
    sampleError: body?.sampleError ? String(redactAll(String(body.sampleError))) : undefined,
  }

  const prompt = buildFailureAnalysisPrompt(summary)
  const result = await generateAIContent(prompt, 'anthropic')

  await recordAudit({ userId, action: 'ai.failure_analysis', resourceType: 'ai', details: { provider: result.provider, ok: result.success } })

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'AI providers unavailable.' }, { status: 503 })
  }
  return NextResponse.json({ ok: true, provider: result.provider, analysis: result.content })
}
