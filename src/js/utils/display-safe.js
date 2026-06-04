const HEBREW_RE = /[\u0590-\u05FF]/;
const HOST_RE = /https?:\/\/([^\s/]+)/i;

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[ch]));
}

export function safeDisplayText(value, fallback = 'Private item') {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  if (!HEBREW_RE.test(text)) return text;
  const host = text.match(HOST_RE)?.[1];
  if (host) return `${host} workflow`;
  return fallback;
}

export function safeWorkflowName(workflow) {
  const id = String(workflow?.id || '').slice(0, 8) || 'unknown';
  return safeDisplayText(workflow?.name, `Workflow ${id}`);
}

export function safeTagName(tag) {
  const raw = typeof tag === 'string' ? tag : tag?.name;
  return safeDisplayText(raw, 'Private tag');
}
