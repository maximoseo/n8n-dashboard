// AI Content Generation - Anthropic & OpenAI
// Set ANTHROPIC_API_KEY, OPENAI_API_KEY, and OPENROUTER_API_KEY in environment variables

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

// Anthropic Claude API
export async function generateWithClaude(
  prompt: string,
  model: string = 'claude-3-sonnet-20240229',
  maxTokens: number = 4000
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Anthropic API error: ${error}` }
    }

    const data = await response.json()
    return { success: true, content: data.content?.[0]?.text }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// OpenAI GPT API
export async function generateWithGPT(
  prompt: string,
  model: string = 'gpt-4o',
  maxTokens: number = 4000
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `OpenAI API error: ${error}` }
    }

    const data = await response.json()
    return { success: true, content: data.choices?.[0]?.message?.content }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// OpenRouter API (fallback with many models)
export async function generateWithOpenRouter(
  prompt: string,
  model: string = 'anthropic/claude-3.5-sonnet'
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://n8n-dashboard-v3.onrender.com',
        'X-Title': 'n8n Dashboard',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `OpenRouter error: ${error}` }
    }

    const data = await response.json()
    return { success: true, content: data.choices?.[0]?.message?.content }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Generic generate function with fallback
export async function generateAIContent(
  prompt: string,
  preferredProvider: 'anthropic' | 'openai' | 'openrouter' = 'anthropic'
): Promise<{ success: boolean; content?: string; error?: string; provider?: string }> {
  const providers = [
    preferredProvider,
    ...(preferredProvider !== 'anthropic' ? ['anthropic'] : []),
    ...(preferredProvider !== 'openai' ? ['openai'] : []),
    ...(preferredProvider !== 'openrouter' ? ['openrouter'] : []),
  ] as const

  for (const provider of providers) {
    let result
    switch (provider) {
      case 'anthropic':
        result = await generateWithClaude(prompt)
        break
      case 'openai':
        result = await generateWithGPT(prompt)
        break
      case 'openrouter':
        result = await generateWithOpenRouter(prompt)
        break
    }

    if (result.success) {
      return { ...result, provider }
    }

    // Log error but continue to next provider
    console.error(`${provider} failed:`, result.error)
  }

  return { success: false, error: 'All AI providers failed' }
}

// Content Brief Generation
export async function generateContentBrief(
  keyword: string,
  searchVolume?: number,
  competition?: string
): Promise<{ success: boolean; brief?: ContentBrief; error?: string }> {
  const prompt = `Generate a comprehensive SEO content brief for the keyword: "${keyword}"

${searchVolume ? `Search Volume: ${searchVolume} monthly searches` : ''}
${competition ? `Competition Level: ${competition}` : ''}

Please provide a detailed brief including:

1. **Target Audience**: Who is searching for this keyword and what is their intent?

2. **Content Type**: What type of content works best (how-to guide, listicle, comparison, etc.)?

3. **Key Points to Cover**: 5-7 main sections/topics that should be included

4. **Recommended Word Count**: Optimal length for ranking

5. **Title Suggestions**: 3 SEO-optimized title options

6. **Meta Description**: 2 compelling meta descriptions (150-160 chars)

7. **Related Keywords**: 10-15 LSI/semantic keywords to include

8. **Internal Linking Opportunities**: Suggest 3-5 related topics to link to

9. **Content Structure**: H2 and H3 outline with brief descriptions

10. **Call-to-Action**: Best CTA for this content

Format the response in clean markdown with clear headings.`

  const result = await generateAIContent(prompt)
  if (!result.success) return result

  // Parse the content brief
  const brief: ContentBrief = {
    keyword,
    searchVolume,
    competition,
    content: result.content || '',
    generatedAt: new Date().toISOString(),
  }

  return { success: true, brief }
}

// Title & Meta Generator
export async function generateTitlesAndMeta(
  keyword: string,
  contentType: 'article' | 'product' | 'service' | 'homepage' = 'article'
): Promise<{ success: boolean; titles?: string[]; metas?: string[]; error?: string }> {
  const prompt = `Generate SEO-optimized titles and meta descriptions for:

Keyword: "${keyword}"
Content Type: ${contentType}

Requirements:
- Titles: 50-60 characters, compelling, include keyword naturally
- Meta Descriptions: 150-160 characters, include CTA, emotional hook

Provide 5 titles and 5 meta descriptions in this format:

TITLES:
1. [title]
2. [title]
...

META DESCRIPTIONS:
1. [description]
2. [description]
...`

  const result = await generateAIContent(prompt)
  if (!result.success) return result

  const content = result.content || ''
  
  // Parse titles and metas
  const titleMatch = content.match(/TITLES:[\s\S]*?(?=META DESCRIPTIONS:|$)/i)
  const metaMatch = content.match(/META DESCRIPTIONS:[\s\S]*/i)
  
  const titles = titleMatch?.[0]
    ?.split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim()) || []
    
  const metas = metaMatch?.[0]
    ?.replace(/META DESCRIPTIONS:/i, '')
    ?.split('\n')
    .filter(line => /^\d+\.?/.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim()) || []

  return { success: true, titles, metas }
}

// Content Analysis & Improvement
export async function analyzeContent(
  content: string,
  keyword: string
): Promise<{ success: boolean; analysis?: ContentAnalysis; error?: string }> {
  const prompt = `Analyze this content for SEO optimization for keyword "${keyword}":

${content.substring(0, 3000)}

Provide analysis in this format:

SEO SCORE: [1-100]

STRENGTHS:
- [strength 1]
- [strength 2]
...

WEAKNESSES:
- [weakness 1]
- [weakness 2]
...

IMPROVEMENTS NEEDED:
1. [specific improvement with priority level]
2. [specific improvement with priority level]
...

KEYWORD OPTIMIZATION:
- Current density: [estimate]
- Recommended: [suggestion]
- Related keywords to add: [list]

READABILITY:
- Score: [assessment]
- Improvements: [suggestions]`

  const result = await generateAIContent(prompt)
  if (!result.success) return result

  const analysis: ContentAnalysis = {
    keyword,
    content: result.content || '',
    analyzedAt: new Date().toISOString(),
  }

  return { success: true, analysis }
}

// Types
export interface ContentBrief {
  keyword: string
  searchVolume?: number
  competition?: string
  content: string
  generatedAt: string
}

export interface ContentAnalysis {
  keyword: string
  content: string
  analyzedAt: string
}

export interface KeywordCluster {
  primary: string
  secondary: string[]
  questions: string[]
  related: string[]
}

// Keyword Clustering
export async function clusterKeywords(
  keywords: string[]
): Promise<{ success: boolean; clusters?: KeywordCluster[]; error?: string }> {
  const prompt = `Group these keywords into semantic clusters (topic-based groups):

${keywords.join('\n')}

For each cluster, provide:
- Primary keyword (highest intent/volume)
- Secondary keywords (supporting terms)
- Related questions (people also ask style)
- Content angle recommendation

Format as JSON-like structure for easy parsing.`

  return await generateAIContent(prompt)
}
