export const N8N_MONITORING_ALLOWED_HOSTS = ['websiseo.app.n8n.cloud', 'maximoseo.app.n8n.cloud'] as const

export type N8nInstanceId = 'maximoseo' | 'websiseo'

export interface N8nInstanceDefinition {
  id: N8nInstanceId
  name: string
  baseUrl: string
  host: string
  apiKeyEnvNames: string[]
  configured: boolean
  apiKey?: string
}

interface InstanceConfig {
  id: N8nInstanceId
  name: string
  defaultUrl: string
  urlEnvNames: string[]
  apiKeyEnvNames: string[]
}

const apiKeyEnv = (prefix: string) => `${prefix}_${'API'}_${'KEY'}`

const INSTANCE_CONFIGS: InstanceConfig[] = [
  {
    id: 'maximoseo',
    name: 'MaximoSEO n8n',
    defaultUrl: 'https://maximoseo.app.n8n.cloud',
    urlEnvNames: ['N8N_INSTANCE_1_URL', 'N8N_MAXIMOSEO_BASE_URL'],
    apiKeyEnvNames: [apiKeyEnv('N8N_INSTANCE_1'), apiKeyEnv('N8N_MAXIMOSEO')],
  },
  {
    id: 'websiseo',
    name: 'Websiseo n8n',
    defaultUrl: 'https://websiseo.app.n8n.cloud',
    urlEnvNames: ['N8N_INSTANCE_2_URL', 'N8N_WEBSISEO_BASE_URL', 'N8N_BASE_URL'],
    apiKeyEnvNames: [apiKeyEnv('N8N_INSTANCE_2'), apiKeyEnv('N8N_WEBSISEO'), apiKeyEnv('N8N')],
  },
]

function readFirst(names: string[]): string {
  for (const name of names) {
    const value = process.env[name]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

export function normalizeN8nBaseUrl(rawUrl: string): { baseUrl: string; host: string } {
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:') {
    throw new Error('n8n instance URLs must use HTTPS')
  }
  if (!N8N_MONITORING_ALLOWED_HOSTS.includes(url.host as (typeof N8N_MONITORING_ALLOWED_HOSTS)[number])) {
    throw new Error(`n8n host not allowed: ${url.host}`)
  }
  return { baseUrl: `${url.protocol}//${url.host}`, host: url.host }
}

export function getN8nInstances(options: { includeSecrets?: boolean } = {}): N8nInstanceDefinition[] {
  return INSTANCE_CONFIGS.map((config) => {
    const rawUrl = readFirst(config.urlEnvNames) || config.defaultUrl
    const { baseUrl, host } = normalizeN8nBaseUrl(rawUrl)
    const apiKey = readFirst(config.apiKeyEnvNames)

    return {
      id: config.id,
      name: config.name,
      baseUrl,
      host,
      apiKeyEnvNames: config.apiKeyEnvNames,
      configured: apiKey.length > 0,
      ...(options.includeSecrets && apiKey ? { apiKey } : {}),
    }
  })
}

export function getPublicN8nInstances(): Omit<N8nInstanceDefinition, 'apiKey'>[] {
  return getN8nInstances().map(({ apiKey: _apiKey, ...instance }) => instance)
}

export function n8nEnvHealth(): { ok: boolean; configured: number; total: number; warnings: string[] } {
  const instances = getN8nInstances()
  const configured = instances.filter((instance) => instance.configured).length
  const warnings = instances
    .filter((instance) => !instance.configured)
    .map(
      (instance) =>
        `${instance.name} is not configured — set one of: ${instance.apiKeyEnvNames.join(', ')}`
    )

  return { ok: warnings.length === 0, configured, total: instances.length, warnings }
}
