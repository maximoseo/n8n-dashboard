# n8n-dashboard.maximo-seo.ai — Plan + Design

> Consolidated execution source of truth for the n8n Monitoring Dashboard.
> This supersedes older phase/audit documents for future planning, but the current repository is **not greenfield**: it already contains a dashboard shell, tabs, `/api/n8n/*` routes, Supabase Auth, scoring, alerts, reports, and tests. New work must preserve and evolve the existing code instead of rewriting it blindly.

## Goal

Build a real multi-instance n8n monitoring command center for `https://n8n-dashboard.maximo-seo.ai/`:

- Multi-instance execution health for at least:
  - `https://maximoseo.app.n8n.cloud`
  - `https://websiseo.app.n8n.cloud`
- Workflow registry, execution feed, error feed, alerting, credentials metadata, webhook health, analytics, and settings.
- Professional “Calm Operations Console” design that holds from 320px through 4K.

## Ground rules

1. **No mock/seed data.** Every workflow, execution, alert, or credential row must come from a real n8n API/Supabase cache derived from n8n. If a connection is missing, render an empty/connect state.
2. **Evidence required.** Every alert/run/error must carry `{ instance_url, execution_id, ts, payload_ref }` when an execution exists; probes use endpoint payload references.
3. **No regressions.** Tests, build, visual QA, accessibility, and Rafter gates are required.
4. **Mobile-first.** 320px+ must work with no horizontal scroll; tap targets >=44px; body/input text >=16px.
5. **English LTR only.** Dashboard UI must remain English.
6. **WCAG AA.** axe zero serious/critical for touched surfaces.
7. **No secrets in code/docs.** n8n API keys, Supabase service-role keys, OAuth secrets, passwords, cookies, and tokens live only in Render/env/password-manager stores.
8. **Rotate leaked credentials.** Anything pasted in chat must be treated as compromised before it is used for staging/production.
9. **Server-side n8n calls only.** Browser never receives n8n API keys.
10. **Ask before adding new third-party APIs beyond the approved stack.**

## Visual identity — Calm Operations Console

- Neutrals with subtle n8n coral accent.
- Status-first palette: success/running/warning/error/waiting/canceled.
- Inter Variable for UI; JetBrains Mono for IDs, durations, logs, JSON.
- lucide-react icon set only.
- Dense but legible tables, with card mapping below `md`.
- Global density toggle later: comfortable / compact / ultra-compact.

## Target route map

- `/login`, `/signup`, `/auth/*`
- `/` overview / portfolio of instances
- `/instances`, `/instances/[id]`
- `/workflows`, `/workflows/[instanceId]/[workflowId]`
- `/executions`, `/executions/[instanceId]/[executionId]`
- `/alerts`, `/alert-rules`
- `/credentials-health`
- `/webhooks`
- `/analytics`
- `/settings`

## Architecture direction

- Next.js + TypeScript + Tailwind + shadcn-compatible primitives.
- Supabase Auth + RLS for user-owned dashboard configuration/cache tables.
- Render web service for UI/API.
- Render cron/poller for `/api/cron/poll` later.
- n8n instance registry from server env, with allowlisted hosts only.
- Per-instance n8n keys encrypted in DB for user-added instances later; current production-managed instances are env-backed.
- SSE live-tail later; short-poll fallback.

## Build order

0. **Baseline + multi-instance probe** — current PR. Capture current repo/app baseline and add auth-gated read-only connectivity probe for both known n8n instances.
1. Tokens + Tailwind + globals + dark/light mode.
2. AppShell: TopBar, LeftRail, BottomTabBar, CommandPalette.
3. Core components: DataTable, RowAsCard, EmptyState, StatusBadge, DurationCell, TimeAgo, JsonTree, LogViewer, RunSparkline.
4. Schema/RLS/crypto/n8n-client foundation.
5. Instances CRUD + encrypted API key storage + test connection.
6. Cron poller + cache tables + circuit breaker.
7. Workflows list/detail + active toggle.
8. Executions list/detail + JSON/log viewer.
9. Live tail SSE on overview.
10. Alert rules + alerts + Resend + Linear.
11. Credentials health + webhooks.
12. Analytics + rollups.
13. Auth polish + OAuth/reset email.
14. Light theme + a11y sweep.
15. Mobile PWA + swipe/PTR/FAB.
16. CI baselines for Lighthouse, axe, visual regression, BrowserStack/TestSprite, Rafter.
17. Final polish, motion, copy, performance budgets.

## PR #0 acceptance

- `n8n-dashboard-plan-and-design.md` committed.
- `scripts/baseline.mjs` and `scripts/probe-instance.mjs` committed.
- `tests/__screenshots__/baseline/SUMMARY.md` and JSON artifacts created without secrets.
- `GET /api/n8n/probe` is auth-gated and reports both known instances as `reachable`, `auth_failed`, `unreachable`, or `unconfigured` without leaking keys or raw upstream bodies.
- Overview UI shows real probe status and empty/connect guidance; no fake data.
- `npm test`, `npm run build`, and Rafter secrets/code/security checks pass or blockers are documented.
- Production rollout only after CI/PR review and credential rotation are complete.

## Security notes for PR #0

- Use env var names only in docs; never values.
- Keep legacy `N8N_API_KEY`/`N8N_BASE_URL` for existing single-instance routes while adding named multi-instance envs.
- Reuse `ALLOWED_N8N_HOSTS` to prevent SSRF.
- Sanitize all probe failures to `HTTP <status>`, `Timeout`, `Network error`, or `Invalid configuration`.
- Do not echo n8n response bodies, headers, query strings containing tokens, or stack traces.
- Audit log/DB writes are deferred; the probe is read-only.

## Production verification policy

After any deploy to `maximo-seo.ai`:

1. Verify the hosting provider deployed the exact commit.
2. Hit health/probe endpoints.
3. Use a browser to verify the live dashboard UI, console, and responsive behavior.
4. Check Render logs for new errors.
5. Purge Cloudflare for the affected domain.
6. Report the Production Live URL and evidence.
