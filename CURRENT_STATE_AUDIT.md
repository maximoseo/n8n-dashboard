# CURRENT_STATE_AUDIT.md

_Audited 2026-06-08 for the "n8n Automation Dashboard command center" upgrade (Phase 0)._

## Stack
- **Next.js 15.5.19** (App Router) · React 18 · TypeScript (non-strict) · Tailwind + lucide-react.
- **Supabase Auth** (HttpOnly session cookie; fixed dashboard username/email verified server-side) + Upstash Redis login rate-limiting.
- Hosted on **Render** (`render.yaml`, `autoDeploy: true` from `main`) → `https://n8n-dashboard.maximo-seo.ai`.
- Build output `distDir: dist`; `images.unoptimized`.

## Routes (before this slice)
- Pages: `/` (auth-gated `<Dashboard/>`), `/login`, `/auth/callback`, `/auth/reset`.
- API: `auth/*`, `ai/generate`, `browserless/screenshot`, `firecrawl/scrape`, `n8n/workflows`, `nofollow/{clone,templates}`, `integrations/status`, `health`, `cron/daily-check`, `agent-tasks/submit`.
- UI is a client-side tabbed `Dashboard` (`src/components/tabs/*`): workflows, urls, kw-research, link-building, analytics, seo-tools, competitors, rank, agent-tasks, nofollow-clone, module-suite.

## Data sources (before)
- `/api/n8n/workflows`: **live** n8n REST fetch (`N8N_API_KEY`/`N8N_BASE_URL`, default `websiseo.app.n8n.cloud`), enriched with executions per request. **No persistence, no health/history.** Returns 503 without a key.
- Supabase tables in repo `database_schema.sql`: `workflow_sheet_mappings`, `monitoring_config`, `dashboard_audit_log`, `user_api_keys` (sample seed data).

## Gaps vs. the super-plan (what this slice closes)
- ❌→✅ No persisted workflow/execution store, health/risk scoring, error center, or sync-status. **Added** `n8nmon_*` tables + sync job + scoring + portfolio API + UI.
- ❌→✅ No `.env.example`, env validation, redaction, or secret scanning. **Added** all four.
- Still open (later PRs): safe mutations, AI debugger/builder, template library, SEO packs, ROI, RBAC roles, alerts fan-out, second n8n instance.

## Security findings (flagged, not all in scope)
- **Shared Supabase project** `wtpczvyupmavzrxisvcm` is used by many Maximo apps. It already has unrelated `n8n_workflows`, `workflows`, `executions`, `n8n_sync_log` tables → this dashboard now namespaces its data as `n8nmon_*` to avoid clobbering them.
- **Supabase advisory:** 21 tables in the shared project have **RLS disabled** (e.g. `n8n_workflows`, `users`, `credentials`, `executions`). Anyone with the anon key can read/modify them. **Out of this PR's scope** — surfaced for the owner to decide policies. Our new `n8nmon_*` + `dashboard_audit_log` tables ship with RLS enabled.
- The n8n API key was pasted into a chat during this work → **must be rotated**.

## Live verification done
- Read-only pipeline proven against production `websiseo.app.n8n.cloud`: **250 workflows** pulled, normalized (trigger types/tags), per-workflow metrics + health/risk scores computed (active+recent→Excellent, inactive/stale→Critical). See PR for output.
