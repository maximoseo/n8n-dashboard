// Firecrawl API Integration
// API Key: fc-fe167396ad9f4f1fb85078ba3a5a705e

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'fc-fe167396ad9f4f1fb85078ba3a5a705e'
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1'

export interface ScrapeResult {
  success: boolean
  data?: {
    markdown?: string
    html?: string
    metadata?: {
      title?: string
      description?: string
      language?: string
      sourceURL?: string
      statusCode?: number
    }
  }
  error?: string
}

export async function scrapeUrl(url: string, formats: ('markdown' | 'html')[] = ['markdown']): Promise<ScrapeResult> {
  try {
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
      return { success: false, error: `Firecrawl API error: ${error}` }
    }

    const data = await response.json()
    return { success: true, data: data.data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function batchScrapeUrls(urls: string[], formats: ('markdown' | 'html')[] = ['markdown']): Promise<ScrapeResult[]> {
  const results = await Promise.all(
    urls.map(url => scrapeUrl(url, formats))
  )
  return results
}

export async function crawlUrl(
  url: string, 
  options: {
    limit?: number
    includePaths?: string[]
    excludePaths?: string[]
    scrapeOptions?: {
      formats?: ('markdown' | 'html')[]
    }
  } = {}
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        ...options,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Firecrawl crawl error: ${error}` }
    }

    const data = await response.json()
    return { success: true, id: data.id }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getCrawlStatus(id: string): Promise<{
  success: boolean
  status?: 'completed' | 'scraping' | 'failed'
  total?: number
  completed?: number
  data?: any[]
  error?: string
}> {
  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl/${id}`, {
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Firecrawl status error: ${error}` }
    }

    const data = await response.json()
    return { success: true, ...data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
