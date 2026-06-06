const BLOCKED_HOSTS = new Set(['localhost', '0.0.0.0'])
const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/i,
  /^fd00:/i,
]

export function validatePublicHttpUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return { ok: false, error: 'URL is required' }
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return { ok: false, error: 'Enter a valid URL' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Only HTTP and HTTPS URLs are supported' }
  }

  const hostname = parsed.hostname.toLowerCase()
  if (BLOCKED_HOSTS.has(hostname) || PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return { ok: false, error: 'Private and local network URLs are not allowed' }
  }

  return { ok: true, url: parsed.toString() }
}
