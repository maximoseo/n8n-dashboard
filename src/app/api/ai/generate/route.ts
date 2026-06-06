import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request)
    if (auth.response) return auth.response

    const { prompt, type = 'content', provider = 'auto' } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    let content: string | null = null
    let usedProvider = ''

    // Try Anthropic first if available and provider is auto or anthropic
    if ((provider === 'auto' || provider === 'anthropic') && ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (response.ok) {
          const data = await response.json()
          content = data.content?.[0]?.text
          usedProvider = 'anthropic'
        }
      } catch (e) {
        console.log('Anthropic failed, trying OpenAI...')
      }
    }

    // Fallback to OpenAI
    if (!content && (provider === 'auto' || provider === 'openai') && OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (response.ok) {
          const data = await response.json()
          content = data.choices?.[0]?.message?.content
          usedProvider = 'openai'
        }
      } catch (e) {
        console.log('OpenAI also failed')
      }
    }

    if (!content) {
      return NextResponse.json({ 
        error: 'All AI providers failed. Please check API keys.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      content,
      provider: usedProvider,
      type,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
