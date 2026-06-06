import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/server-auth'
import { validatePublicHttpUrl } from '@/lib/url-validation'

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || ''
const BROWSERLESS_BASE_URL = 'https://chrome.browserless.io'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser(request)
    if (auth.response) return auth.response

    const { url, viewport = 'desktop', fullPage = false, type = 'png' } = await request.json()

    const validatedUrl = validatePublicHttpUrl(url)
    if (!validatedUrl.ok) {
      return NextResponse.json({ error: validatedUrl.error }, { status: 400 })
    }

    if (!BROWSERLESS_API_KEY) {
      return NextResponse.json({ error: 'Browserless API key not configured' }, { status: 500 })
    }

    const viewportSizes = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 },
      wide: { width: 2560, height: 1440 },
    }

    const response = await fetch(`${BROWSERLESS_BASE_URL}/screenshot?token=${BROWSERLESS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: validatedUrl.url,
        viewport: viewportSizes[viewport as keyof typeof viewportSizes] || viewportSizes.desktop,
        options: {
          fullPage,
          type,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error: `Browserless error: ${error}` }, { status: 500 })
    }

    const blob = await response.blob()
    const base64 = await blobToBase64(blob)

    return NextResponse.json({ 
      success: true, 
      image: base64,
      url: validatedUrl.url,
      viewport,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Screenshot error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return `data:image/png;base64,${buffer.toString('base64')}`
}
