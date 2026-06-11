# Secure Design Review — PR #0 n8n Multi-Instance Probe

Date: 2026-06-11
Scope: auth-gated read-only n8n connectivity probe and baseline instrumentation.
Rafter note: the local Rafter installation exposes scanner/briefing commands but the sibling `rafter-secure-design` skill is not installed in Hermes skill storage. This document applies the Rafter shift-left guidance for auth, input boundaries, secrets handling, and threat modeling, then final validation uses `rafter secrets` / `rafter run` where available.

## Assets

- n8n API keys for `websiseo.app.n8n.cloud` and `maximoseo.app.n8n.cloud`.
- Supabase Auth session bearer token.
- Dashboard production domain and Render env.
- n8n workflow/execution metadata.

## Trust boundaries

- Browser -> Next.js route handlers: bearer token required.
- Next.js server -> n8n Cloud API: API keys from env only.
- Next.js server -> Supabase Auth: anon key/session validation.
- Render env/password manager -> application runtime: secrets never committed.

## Design decisions

1. **Authentication**: `/api/n8n/probe` requires the existing Supabase bearer session via `requireAuthenticatedUser`.
2. **Authorization**: PR #0 does not add multi-tenant RBAC. It preserves existing authenticated-user access and limits the route to read-only reachability metadata.
3. **SSRF prevention**: only hosts in `ALLOWED_N8N_HOSTS` are accepted. Env URL values are normalized and rejected if they point anywhere else.
4. **Secrets**: API keys are resolved server-side from env. Public registry functions omit keys by default; tests assert serialized public output does not contain configured secret strings.
5. **Response redaction**: probe responses include status codes and generic failure classes only. No upstream body, request headers, stack trace, or URL query token is returned.
6. **Logging**: no probe code logs API keys or raw upstream errors.
7. **External side effects**: probe only calls `GET /api/v1/workflows?limit=1` and `GET /api/v1/executions?limit=1`. It does not mutate n8n workflows, credentials, executions, or Supabase data.
8. **Evidence**: each instance result includes evidence metadata with `instance_url`, `ts`, and `payload_ref` pointing at endpoint classes rather than payload contents.

## Threat model

- Leaked API key via JSON response: mitigated by public DTO separation and tests.
- SSRF via env-controlled URL: mitigated by allowlist normalization.
- Upstream error body leaks tokens/HTML: mitigated by generic error classification.
- Unauthenticated probe enumeration: mitigated by bearer session requirement.
- False confidence from mock data: mitigated by `unconfigured`/`unreachable` statuses and no seed data.
- Credential already leaked in chat: operational blocker; rotate before using real keys for staging/production checks.

## PR #0 security checklist

- [x] Read-only route design.
- [x] Auth gate retained.
- [x] Host allowlist retained.
- [x] Secret values excluded from files/docs.
- [x] Error response redaction designed.
- [x] `npm test` after implementation.
- [x] `npm run build` after implementation.
- [x] `rafter secrets .` after implementation.
- [ ] `rafter run` if `RAFTER_API_KEY`/quota is available. Current local attempt was blocked by monthly fast-scan quota.
