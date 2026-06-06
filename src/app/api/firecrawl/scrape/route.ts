import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { validatePublicHttpUrl } from '@/lib/url-validation'

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request)
    if (auth.response) return auth.response

    const { url, formats = ['markdown'] } = await request.json()

    const validatedUrl = validatePublicHttpUrl(url)
    if (!validatedUrl.ok) {
      return NextResponse.json({ error: validatedUrl.error }, { status: 400 })
    }

    if (!FIRECRAWL_API_KEY) {
      return NextResponse.json({ error: 'Firecrawl API key not configured' }, { status: 500 })
    }

    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: validatedUrl.url,
        formats,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error: `Firecrawl error: ${error}` }, { status: 500 })
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data.data,
      url: validatedUrl.url,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
