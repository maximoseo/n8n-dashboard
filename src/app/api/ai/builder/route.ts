import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { generateAIContent } from '@/lib/ai'
import { buildWorkflowSpecPrompt } from '@/lib/ai-prompts'
import { redactAll } from '@/lib/redaction'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * AI Builder: natural-language goal -> a SAFE workflow SPECIFICATION (a plan,
 * never a production mutation). Input is redacted before reaching the model.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.response) return auth.response
  const userId = auth.user?.id ?? auth.user?.sub ?? null

  const body = await request.json().catch(() => ({}))
  const goal = typeof body?.goal === 'string' ? body.goal.trim() : ''
  if (goal.length < 8) return NextResponse.json({ error: 'Describe the automation goal (>= 8 chars).' }, { status: 400 })

  const safeGoal = String(redactAll(goal))
  const safeClient = body?.client ? String(redactAll(String(body.client))) : undefined
  const trigger = typeof body?.trigger === 'string' ? body.trigger : undefined

  const prompt = buildWorkflowSpecPrompt(safeGoal, { client: safeClient, trigger })
  const result = await generateAIContent(prompt, 'anthropic')

  await recordAudit({
    userId,
    action: 'ai.builder.spec',
    resourceType: 'ai',
    details: { goalLength: goal.length, provider: result.provider, ok: result.success },
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'AI providers unavailable. Configure ANTHROPIC_API_KEY / OPENAI_API_KEY.' }, { status: 503 })
  }
  return NextResponse.json({ ok: true, provider: result.provider, spec: result.content })
}
