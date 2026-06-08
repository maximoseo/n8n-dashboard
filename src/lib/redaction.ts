/**
 * Centralized redaction utilities.
 *
 * Every value that leaves the server toward a log line, an AI prompt, or a
 * persisted error payload MUST pass through here first. Keep this module
 * dependency-free so it can run under `node --test` without a bundler.
 */

// Keys whose values are always secret regardless of shape.
const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|token|password|passwd|authorization|auth|cookie|session|bearer|private[_-]?key|service[_-]?role|refresh[_-]?token|client[_-]?secret|dsn)/i

// Inline secret-looking values (JWTs, long hex/base64 tokens, n8n keys, sk- keys).
const INLINE_SECRET_PATTERNS: Array<[RegExp, string]> = [
  // JWT: three base64url segments
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, '[REDACTED_JWT]'],
  // Provider keys: sk-..., rk_..., key-..., xoxb-..., ghp_...
  [/\b(?:sk|rk|pk|key)[-_][A-Za-z0-9]{16,}\b/g, '[REDACTED_KEY]'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, '[REDACTED_KEY]'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, '[REDACTED_KEY]'],
  // Bearer header value
  [/Bearer\s+[A-Za-z0-9._-]{12,}/gi, 'Bearer [REDACTED]'],
  // Long opaque hex/base64 blobs (>= 32 chars) that are likely tokens
  [/\b[A-Fa-f0-9]{32,}\b/g, '[REDACTED_HEX]'],
]

// Basic PII patterns.
const PII_PATTERNS: Array<[RegExp, string]> = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED_EMAIL]'],
  // E.164-ish phone numbers
  [/\+?\d[\d\s().-]{7,}\d/g, '[REDACTED_PHONE]'],
]

const REDACTED = '[REDACTED]'
const MAX_STRING_LEN = 2000

export function redactString(input: string): string {
  let out = input
  for (const [pattern, replacement] of INLINE_SECRET_PATTERNS) {
    out = out.replace(pattern, replacement)
  }
  return out
}

export function redactPiiString(input: string): string {
  let out = input
  for (const [pattern, replacement] of PII_PATTERNS) {
    out = out.replace(pattern, replacement)
  }
  return out
}

/**
 * Deep-redact a value: object keys matching SECRET_KEY_PATTERN are masked,
 * strings are scanned for inline secrets, and oversized strings are truncated.
 */
export function redactSecrets(value: unknown, opts: { pii?: boolean } = {}): unknown {
  return walk(value, opts.pii === true, new WeakSet())
}

/** Redact secrets AND PII. Use before any AI prompt or external log sink. */
export function redactAll(value: unknown): unknown {
  return redactSecrets(value, { pii: true })
}

function walk(value: unknown, pii: boolean, seen: WeakSet<object>): unknown {
  if (value == null) return value
  if (typeof value === 'string') {
    let s = redactString(value)
    if (pii) s = redactPiiString(s)
    if (s.length > MAX_STRING_LEN) s = s.slice(0, MAX_STRING_LEN) + '…[truncated]'
    return s
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value !== 'object') return REDACTED // functions, symbols, bigint

  if (seen.has(value as object)) return '[Circular]'
  seen.add(value as object)

  if (Array.isArray(value)) {
    return value.map((v) => walk(v, pii, seen))
  }

  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      out[key] = REDACTED
    } else {
      out[key] = walk(v, pii, seen)
    }
  }
  return out
}
