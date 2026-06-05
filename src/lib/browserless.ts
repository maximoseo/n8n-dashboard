// Browserless API Integration
// API Key: 2Ua28OlYbodr5tv902687876ff772951e2af866e9f7e84ace

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || '2Ua28OlYbodr5tv902687876ff772951e2af866e9f7e84ace'
const BROWSERLESS_BASE_URL = 'https://chrome.browserless.io'

export interface ScreenshotOptions {
  viewport?: {
    width: number
    height: number
  }
  fullPage?: boolean
  type?: 'png' | 'jpeg' | 'webp'
  quality?: number // 0-100 for jpeg/webp
}

export interface PDFOptions {
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
  printBackground?: boolean
  landscape?: boolean
  format?: 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6'
}

export async function takeScreenshot(
  url: string,
  options: ScreenshotOptions = {}
): Promise<Blob | null> {
  try {
    const defaultViewport = { width: 1920, height: 1080 }
    const viewport = options.viewport || defaultViewport

    const response = await fetch(`${BROWSERLESS_BASE_URL}/screenshot?token=${BROWSERLESS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        options: {
          viewport,
          fullPage: options.fullPage ?? false,
          type: options.type || 'png',
          ...(options.quality && { quality: options.quality }),
        },
      }),
    })

    if (!response.ok) {
      console.error('Browserless screenshot error:', await response.text())
      return null
    }

    return await response.blob()
  } catch (error) {
    console.error('Browserless error:', error)
    return null
  }
}

export async function generatePDF(
  url: string,
  options: PDFOptions = {}
): Promise<Blob | null> {
  try {
    const response = await fetch(`${BROWSERLESS_BASE_URL}/pdf?token=${BROWSERLESS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        options: {
          printBackground: options.printBackground ?? true,
          ...(options.format && { format: options.format }),
          ...(options.landscape && { landscape: options.landscape }),
          ...(options.displayHeaderFooter && { 
            displayHeaderFooter: options.displayHeaderFooter,
            headerTemplate: options.headerTemplate,
            footerTemplate: options.footerTemplate,
          }),
        },
      }),
    })

    if (!response.ok) {
      console.error('Browserless PDF error:', await response.text())
      return null
    }

    return await response.blob()
  } catch (error) {
    console.error('Browserless error:', error)
    return null
  }
}

export async function scrapeContent(
  url: string
): Promise<{ title?: string; content?: string; error?: string } | null> {
  try {
    const response = await fetch(`${BROWSERLESS_BASE_URL}/content?token=${BROWSERLESS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { error: `Browserless content error: ${error}` }
    }

    const html = await response.text()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : undefined
    
    return { title, content: html }
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Preset viewport configurations
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  wide: { width: 2560, height: 1440 },
}

export async function takeMobileScreenshot(url: string, fullPage?: boolean): Promise<Blob | null> {
  return takeScreenshot(url, { viewport: VIEWPORTS.mobile, fullPage })
}

export async function takeDesktopScreenshot(url: string, fullPage?: boolean): Promise<Blob | null> {
  return takeScreenshot(url, { viewport: VIEWPORTS.desktop, fullPage })
}
