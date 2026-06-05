// DataForSEO API Integration
// Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in environment variables

const LOGIN = process.env.DATAFORSEO_LOGIN || ''
const PASSWORD = process.env.DATAFORSEO_PASSWORD || ''
const BASE_URL = 'https://api.dataforseo.com/v3'

// Base64 encode credentials
const credentials = Buffer.from(`${LOGIN}:${PASSWORD}`).toString('base64')

interface APIResponse<T> {
  status_code: number
  status_message: string
  tasks?: Array<{
    id: string
    status_code: number
    status_message: string
    result?: T[]
  }>
}

// Keyword Search Volume
export async function getKeywordSearchVolume(
  keywords: string[],
  locationCode: number = 2840, // USA
  languageCode: string = 'en'
): Promise<{
  success: boolean
  data?: Array<{
    keyword: string
    search_volume: number
    cpc: number
    competition: number
    monthly_searches: Array<{ year: number; month: number; search_volume: number }>
  }>
  error?: string
}> {
  try {
    const response = await fetch(`${BASE_URL}/keywords_data/google/search_volume/live`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        keywords.map(keyword => ({
          keyword,
          location_code: locationCode,
          language_code: languageCode,
        }))
      ),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `DataForSEO error: ${error}` }
    }

    const data: APIResponse<any> = await response.json()
    
    if (data.status_code !== 20000) {
      return { success: false, error: data.status_message }
    }

    const results = data.tasks?.[0]?.result || []
    return { success: true, data: results }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// SERP Data
export async function getSERPData(
  keyword: string,
  locationCode: number = 2840,
  languageCode: string = 'en',
  device: 'desktop' | 'mobile' = 'desktop'
): Promise<{
  success: boolean
  data?: {
    keyword: string
    location_code: number
    language_code: string
    check_url: string
    serp_items: Array<{
      type: string
      rank_group: number
      rank_absolute: number
      domain: string
      title: string
      description: string
      url: string
    }>
  }
  error?: string
}> {
  try {
    const response = await fetch(`${BASE_URL}/serp/google/organic/live/${device}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        keyword,
        location_code: locationCode,
        language_code: languageCode,
      }]),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `DataForSEO error: ${error}` }
    }

    const data: APIResponse<any> = await response.json()
    
    if (data.status_code !== 20000) {
      return { success: false, error: data.status_message }
    }

    const result = data.tasks?.[0]?.result?.[0]
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Backlinks Data
export async function getBacklinksData(domain: string): Promise<{
  success: boolean
  data?: {
    domain: string
    rank: number
    backlinks: number
    referring_domains: number
    referring_ips: number
    referring_class_c: number
    referring_pages: number
  }
  error?: string
}> {
  try {
    const response = await fetch(`${BASE_URL}/backlinks/summary/live`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        target: domain,
      }]),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `DataForSEO error: ${error}` }
    }

    const data: APIResponse<any> = await response.json()
    
    if (data.status_code !== 20000) {
      return { success: false, error: data.status_message }
    }

    const result = data.tasks?.[0]?.result?.[0]
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Keywords for Site (Competitor Analysis)
export async function getKeywordsForSite(
  domain: string,
  locationCode: number = 2840,
  languageCode: string = 'en'
): Promise<{
  success: boolean
  data?: Array<{
    keyword: string
    position: number
    search_volume: number
    cpc: number
    competition: number
  }>
  error?: string
}> {
  try {
    const response = await fetch(`${BASE_URL}/keywords_data/google/keywords_for_site/live`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        target: domain,
        location_code: locationCode,
        language_code: languageCode,
      }]),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `DataForSEO error: ${error}` }
    }

    const data: APIResponse<any> = await response.json()
    
    if (data.status_code !== 20000) {
      return { success: false, error: data.status_message }
    }

    const results = data.tasks?.[0]?.result || []
    return { success: true, data: results }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Domain Metrics (On-Page API)
export async function getDomainMetrics(domain: string): Promise<{
  success: boolean
  data?: {
    domain: string
    pages_count: number
    total_size: number
    checks_count: number
  }
  error?: string
}> {
  try {
    const response = await fetch(`${BASE_URL}/on_page/summary`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        target: domain,
        max_crawl_pages: 100,
      }]),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `DataForSEO error: ${error}` }
    }

    const data: APIResponse<any> = await response.json()
    
    if (data.status_code !== 20000) {
      return { success: false, error: data.status_message }
    }

    const result = data.tasks?.[0]?.result?.[0]
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Helper to calculate SEO score
export function calculateSEOPercentile(rank: number): string {
  if (rank >= 90) return 'Top 1%'
  if (rank >= 80) return 'Top 5%'
  if (rank >= 70) return 'Top 10%'
  if (rank >= 60) return 'Top 25%'
  if (rank >= 50) return 'Average'
  if (rank >= 40) return 'Below Average'
  return 'Needs Work'
}
