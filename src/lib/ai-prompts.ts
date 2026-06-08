/**
 * Prompt builders for the AI Builder and AI failure analysis. Pure + dependency-
 * free so they unit-test. Callers MUST pass already-redacted input (routes run
 * redactAll first) — these builders never see raw secrets.
 */

export function buildWorkflowSpecPrompt(goal: string, context: { client?: string; trigger?: string } = {}): string {
  return [
    'You are an expert n8n automation architect.',
    'Produce a SAFE workflow SPECIFICATION (a plan, NOT a production change) for the goal below.',
    '',
    `GOAL: ${goal}`,
    context.client ? `CLIENT/SITE: ${context.client}` : '',
    context.trigger ? `PREFERRED TRIGGER: ${context.trigger}` : '',
    '',
    'Respond in Markdown with these sections:',
    '1. Summary',
    '2. Trigger (type + schedule/webhook details)',
    '3. Nodes (ordered list: node name, n8n node type, purpose)',
    '4. Credentials required (service + scope; reference by name only, never values)',
    '5. Data flow',
    '6. Failure handling (retries, error workflow, alerts)',
    '7. Cost & rate-limit risks',
    '8. Privacy risks (PII/secrets to redact)',
    '',
    'Do NOT invent credentials or secrets. Do NOT output anything that should be activated automatically — this is a draft for human review.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildFailureAnalysisPrompt(summary: {
  workflowName: string
  occurrences: number
  affectedWorkflows: number
  lastSeen: string | null
  sampleError?: string
}): string {
  return [
    'You are an SRE assistant analyzing an n8n workflow failure cluster.',
    'The data below is already redacted. Do NOT request raw logs or secrets.',
    '',
    `Cluster: ${summary.workflowName}`,
    `Occurrences: ${summary.occurrences}`,
    `Affected workflows: ${summary.affectedWorkflows}`,
    `Last seen: ${summary.lastSeen ?? 'unknown'}`,
    summary.sampleError ? `Redacted error sample: ${summary.sampleError}` : '',
    '',
    'Respond in Markdown with: Probable root cause; Likely category (credential/rate-limit/timeout/schema/network/logic); Suggested fix (concrete, n8n-specific); Whether a safe retry is advisable; A one-line task title for tracking.',
  ]
    .filter(Boolean)
    .join('\n')
}
