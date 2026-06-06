export interface NofollowCloneRequest {
  sourceWorkflowId?: string
  sourceDomain?: string
  siteName: string
  siteUrl: string
  keyword: string
  location?: string
  sheetTitle?: string
  activate?: boolean
}

export interface NofollowSheetSeed {
  title: string
  values: string[][]
}

const DEFAULT_SOURCE_TERMS = [
  '{{SITE_NAME}}',
  '{{SITE_URL}}',
  '{{DOMAIN}}',
  '{{KEYWORD}}',
  '{{LOCATION}}',
  '{{SPREADSHEET_ID}}',
  '{{SPREADSHEET_URL}}',
]

export function normalizeSiteUrl(rawUrl: string) {
  const trimmed = rawUrl.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const url = new URL(withProtocol)

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS site URLs are supported')
  }

  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

export function getDomain(siteUrl: string) {
  return new URL(normalizeSiteUrl(siteUrl)).hostname.replace(/^www\./i, '')
}

export function buildSheetTitle(input: NofollowCloneRequest) {
  const domain = getDomain(input.siteUrl)
  const base = input.sheetTitle?.trim() || `Nofollow - ${domain} - ${input.keyword.trim()}`
  return base.replace(/[\\/?*[\]:]/g, '-').slice(0, 95)
}

export function buildWorkflowName(input: NofollowCloneRequest) {
  const domain = getDomain(input.siteUrl)
  const siteName = input.siteName.trim() || domain
  return `${siteName} - Nofollow - ${input.keyword.trim()}`.slice(0, 120)
}

export function buildKeywordPrompts(input: NofollowCloneRequest) {
  const siteUrl = normalizeSiteUrl(input.siteUrl)
  const domain = getDomain(siteUrl)
  const keyword = input.keyword.trim()
  const location = input.location?.trim()
  const marketLine = location ? `Target market/location: ${location}` : 'Target market/location: infer from the website and SERP.'

  return [
    {
      name: 'Keyword discovery',
      prompt: `Research nofollow link opportunities for ${domain}.
Primary keyword: ${keyword}
${marketLine}
Return search operators, relevant directories, forums, partner pages, citation sources, and outreach angles. Prioritize real opportunities that fit the website and avoid synthetic examples.`,
    },
    {
      name: 'SERP qualification',
      prompt: `Qualify SERP results for the keyword "${keyword}" and the website ${siteUrl}.
Score each opportunity by topical fit, link attribute expectation, traffic potential, and implementation effort. Mark whether a nofollow link is acceptable or expected.`,
    },
    {
      name: 'Outreach brief',
      prompt: `Create a concise outreach brief for ${domain} focused on "${keyword}".
Include the value proposition, safe anchor text options, target page recommendation, and compliance notes for rel="nofollow" or rel="sponsored" where relevant.`,
    },
  ]
}

export function buildSheetSeed(input: NofollowCloneRequest): NofollowSheetSeed[] {
  const siteUrl = normalizeSiteUrl(input.siteUrl)
  const domain = getDomain(siteUrl)
  const prompts = buildKeywordPrompts(input)

  return [
    {
      title: 'Setup',
      values: [
        ['Field', 'Value'],
        ['Site name', input.siteName.trim()],
        ['Site URL', siteUrl],
        ['Domain', domain],
        ['Primary keyword', input.keyword.trim()],
        ['Location', input.location?.trim() || ''],
        ['Created by', 'n8n dashboard Nofollow Clone'],
        ['Created at', new Date().toISOString()],
      ],
    },
    {
      title: 'Keywords',
      values: [
        ['Keyword', 'Intent', 'Priority', 'Source', 'Status', 'Notes'],
        [input.keyword.trim(), 'primary', 'high', 'dashboard intake', 'ready', 'Seed keyword for the cloned Nofollow workflow'],
      ],
    },
    {
      title: 'Prompts',
      values: [
        ['Prompt name', 'Prompt'],
        ...prompts.map((item) => [item.name, item.prompt]),
      ],
    },
    {
      title: 'Opportunities',
      values: [
        ['URL', 'Domain', 'Type', 'Target keyword', 'Rel', 'Status', 'Notes'],
      ],
    },
    {
      title: 'Runs',
      values: [
        ['Run at', 'Workflow ID', 'Status', 'Summary'],
      ],
    },
  ]
}

export function replaceWorkflowValues<T>(
  value: T,
  replacements: Record<string, string | undefined>,
): T {
  if (typeof value === 'string') {
    let next: string = value
    for (const [from, to] of Object.entries(replacements)) {
      if (!from || to === undefined) continue
      next = next.split(from).join(to)
    }
    return next as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceWorkflowValues(item, replacements)) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        replaceWorkflowValues(item, replacements),
      ]),
    ) as T
  }

  return value
}

export function buildWorkflowClonePayload(
  sourceWorkflow: any,
  input: NofollowCloneRequest,
  sheet: { spreadsheetId: string; spreadsheetUrl: string },
) {
  const siteUrl = normalizeSiteUrl(input.siteUrl)
  const domain = getDomain(siteUrl)
  const prompts = buildKeywordPrompts(input)
  const sourceDomain = input.sourceDomain?.trim()
  const replacements: Record<string, string | undefined> = {
    ...Object.fromEntries(DEFAULT_SOURCE_TERMS.map((term) => [term, undefined])),
    '{{SITE_NAME}}': input.siteName.trim(),
    '{{SITE_URL}}': siteUrl,
    '{{DOMAIN}}': domain,
    '{{KEYWORD}}': input.keyword.trim(),
    '{{LOCATION}}': input.location?.trim() || '',
    '{{SPREADSHEET_ID}}': sheet.spreadsheetId,
    '{{SPREADSHEET_URL}}': sheet.spreadsheetUrl,
    [sourceDomain || '']: domain,
  }

  const nodes = retargetGoogleSheetsNodes(
    replaceWorkflowValues(sourceWorkflow.nodes || [], replacements),
    input,
    sheet,
  )
  const connections = replaceWorkflowValues(sourceWorkflow.connections || {}, replacements)
  const settings = replaceWorkflowValues(sourceWorkflow.settings || {}, replacements)

  return {
    name: buildWorkflowName(input),
    active: false,
    nodes: injectNofollowMetadata(nodes, {
      siteUrl,
      domain,
      keyword: input.keyword.trim(),
      spreadsheetId: sheet.spreadsheetId,
      spreadsheetUrl: sheet.spreadsheetUrl,
      prompts,
    }),
    connections,
    settings,
    staticData: null,
  }
}

function retargetGoogleSheetsNodes(
  nodes: any[],
  input: NofollowCloneRequest,
  sheet: { spreadsheetId: string; spreadsheetUrl: string },
) {
  const sheetTitle = buildSheetTitle(input)
  const seededSheetTitles = buildSheetSeed(input).map((seed) => seed.title)

  return nodes.map((node) => {
    if (node?.type !== 'n8n-nodes-base.googleSheets') return node

    const parameters = { ...(node.parameters || {}) }
    parameters.documentId = {
      __rl: true,
      value: sheet.spreadsheetId,
      mode: 'id',
      cachedResultName: sheetTitle,
      cachedResultUrl: sheet.spreadsheetUrl,
    }

    const currentSheetName = normalizeSheetName(parameters.sheetName)
    if (!currentSheetName || !seededSheetTitles.includes(currentSheetName)) {
      parameters.sheetName = {
        __rl: true,
        value: pickSeedSheetForNode(node),
        mode: 'name',
      }
    }

    return { ...node, parameters }
  })
}

function normalizeSheetName(sheetName: unknown) {
  if (!sheetName) return ''
  if (typeof sheetName === 'string') return sheetName
  if (typeof sheetName === 'object') {
    const value = sheetName as Record<string, unknown>
    return String(value.cachedResultName || value.value || '')
  }
  return String(sheetName)
}

function pickSeedSheetForNode(node: any) {
  const name = String(node?.name || '').toLowerCase()
  const operation = String(node?.parameters?.operation || '').toLowerCase()

  if (/prompt/.test(name)) return 'Prompts'
  if (/opportun|link|url|domain|grab|lookup|read|cluster/.test(name)) return 'Opportunities'
  if (/run|status|complete|mark|update|log/.test(name) || operation === 'update') return 'Runs'
  if (/keyword|query|serp/.test(name)) return 'Keywords'
  return 'Setup'
}

function injectNofollowMetadata(nodes: any[], metadata: Record<string, unknown>) {
  const metadataJson = JSON.stringify(metadata, null, 2)
  const noteExists = nodes.some((node) => node?.name === 'Nofollow Clone Metadata')

  if (noteExists) {
    return nodes.map((node) => {
      if (node?.name !== 'Nofollow Clone Metadata') return node
      return {
        ...node,
        parameters: { ...node.parameters, content: metadataJson },
      }
    })
  }

  return [
    ...nodes,
    {
      parameters: { content: metadataJson },
      id: `nofollow-clone-metadata-${Date.now()}`,
      name: 'Nofollow Clone Metadata',
      type: 'n8n-nodes-base.stickyNote',
      typeVersion: 1,
      position: [0, 0],
    },
  ]
}
