import { NextRequest, NextResponse } from 'next/server'

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1'

export async function POST(request: NextRequest) {
  try {
    const { url, formats = ['markdown'] } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
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
        url,
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
      url,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
