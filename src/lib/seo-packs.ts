/**
 * SEO Automation Pack catalog + run helpers (pure, dependency-free).
 * A pack is a named group of child analyses orchestrated under one run with a
 * shared correlation id. Definitions are static config; execution is delegated
 * to n8n via a configurable webhook (see /api/seo/packs/run).
 */

export interface PackChild {
  key: string
  label: string
  services: string[]
}

export interface PackDefinition {
  id: string
  name: string
  description: string
  children: PackChild[]
}

export const SEO_PACKS: PackDefinition[] = [
  {
    id: 'full_site_analysis',
    name: 'Full Site Analysis',
    description: 'End-to-end technical, on-page, keyword, backlink, local and GEO checks for one site.',
    children: [
      { key: 'site.discovery', label: 'Site discovery', services: ['firecrawl', 'browserless'] },
      { key: 'seo.technical_crawl', label: 'Technical crawl', services: ['screaming_frog', 'dataforseo'] },
      { key: 'seo.onpage', label: 'On-page checks', services: ['dataforseo'] },
      { key: 'seo.keyword_research', label: 'Keyword research', services: ['dataforseo', 'serpapi'] },
      { key: 'seo.backlinks', label: 'Backlinks', services: ['ahrefs'] },
      { key: 'seo.local_gbp', label: 'Local / GBP', services: ['google_places'] },
      { key: 'seo.geo_ai_visibility', label: 'GEO / AI visibility', services: ['perplexity', 'exa'] },
      { key: 'report.client', label: 'Client report', services: ['ai'] },
      { key: 'tasks.create', label: 'Create tasks', services: ['supabase'] },
    ],
  },
  { id: 'technical_audit', name: 'Technical SEO Audit', description: 'Crawl, Core Web Vitals, schema, indexability.', children: [
    { key: 'seo.technical_crawl', label: 'Technical crawl', services: ['screaming_frog'] },
    { key: 'seo.cwv', label: 'Core Web Vitals', services: ['dataforseo', 'browserless'] },
    { key: 'seo.schema', label: 'Schema / structured data', services: ['firecrawl'] },
  ] },
  { id: 'keyword_research', name: 'Keyword Research', description: 'Discovery + clustering + intent.', children: [
    { key: 'seo.keyword_research', label: 'Keyword discovery', services: ['dataforseo'] },
    { key: 'seo.clustering', label: 'Clustering', services: ['ai'] },
  ] },
  { id: 'backlinks', name: 'Backlinks', description: 'Referring domains + risk monitoring.', children: [
    { key: 'seo.backlinks', label: 'Backlink profile', services: ['ahrefs'] },
    { key: 'seo.backlink_risk', label: 'Risk monitoring', services: ['ahrefs'] },
  ] },
  { id: 'local_gbp', name: 'Local SEO / GBP', description: 'Local visibility, reviews, competitors.', children: [
    { key: 'seo.local_gbp', label: 'GBP checks', services: ['google_places'] },
    { key: 'seo.reviews', label: 'Review monitoring', services: ['google_places'] },
  ] },
  { id: 'geo_ai_visibility', name: 'GEO / AI Visibility', description: 'Presence in AI answers and citations.', children: [
    { key: 'seo.geo_ai_visibility', label: 'AI answer presence', services: ['perplexity', 'exa', 'ahrefs'] },
  ] },
  { id: 'content_publishing', name: 'Content Brief & Publishing', description: 'Briefs, gaps, drafts.', children: [
    { key: 'content.gap', label: 'Content gap', services: ['dataforseo'] },
    { key: 'content.brief', label: 'Brief generation', services: ['ai'] },
  ] },
  { id: 'monitoring_alerts', name: 'Monitoring & Alerts', description: 'Change, broken links, sitemap, CWV.', children: [
    { key: 'monitor.changes', label: 'Website change', services: ['firecrawl'] },
    { key: 'monitor.broken_links', label: 'Broken links', services: ['screaming_frog'] },
  ] },
]

export function getPack(id: string): PackDefinition | undefined {
  return SEO_PACKS.find((p) => p.id === id)
}

/** All distinct services required across a pack's children. */
export function packServices(pack: PackDefinition): string[] {
  return [...new Set(pack.children.flatMap((c) => c.services))].sort()
}

/** Overall score from child area scores (0..100 each). Returns null if empty. */
export function computePackScore(areaScores: Array<number | null | undefined>): number | null {
  const valid = areaScores.filter((s): s is number => typeof s === 'number')
  if (valid.length === 0) return null
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

const DOMAIN_RE = /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/.*)?$/i

export function isValidDomain(input: string): boolean {
  return DOMAIN_RE.test(input.trim())
}
