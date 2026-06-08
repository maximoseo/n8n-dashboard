# Task Plan

## Goal
Make the dashboard show REAL n8n workflow + execution data (read-only) with health/risk scoring, on a security baseline (.env.example, env validation, redaction, secret scanning, audit log). Slice 1 of the super-plan.

## Todo
- [x] Phase 0: clone repo, baseline build green, branch `feature/n8n-command-center`, audit doc
- [x] Phase 1: `.env.example` (placeholders), `src/lib/env.ts`, `src/lib/redaction.ts` (+tests), CI gitleaks+build+test, `src/lib/audit.ts`
- [x] Phase 2: `src/lib/n8n/{client,types,normalize,sync}.ts`, `src/lib/scoring.ts` (+tests), migration `supabase/migrations/0001_n8n_core.sql` (namespaced `n8nmon_*`)
- [x] Phase 3: `scripts/sync-n8n.mjs` + `POST /api/n8n/sync` (user- or `x-sync-secret`-gated)
- [x] Phase 4: Workflow Portfolio UI (`workflows-tab.tsx`) — health badges, status filter, sync-status card, failed-executions panel, `Open in n8n`; `GET /api/n8n/portfolio` with graceful fallback to live route
- [x] Live-verify read pipeline against production n8n (250 workflows, scoring) — DONE
- [x] Build green · 12 unit tests green
- [ ] **BLOCKED on owner OK:** apply migration to shared Supabase `wtpczvyupmavzrxisvcm` (auto-guard denied prod DB mutation; needs explicit approval)
- [ ] **BLOCKED on secret:** set `SUPABASE_SERVICE_ROLE_KEY` (Render) to enable the DB-write sync + portfolio
- [ ] Open PR; owner reviews & merges (production untouched until merge)
- [ ] Owner: ROTATE the n8n API key pasted in chat

## Scope Guardrails
- Allowed: new `src/lib/{env,redaction,scoring,audit}.ts`, `src/lib/n8n/*`, `src/app/api/n8n/{sync,portfolio}/route.ts`, `scripts/sync-n8n.mjs`, `supabase/migrations/0001_n8n_core.sql`, `.env.example`, `.github/workflows/ci.yml`, `CURRENT_STATE_AUDIT.md`, tests; modify `workflows-tab.tsx`, `package.json`, `tsconfig.json` (exclude tests), `README.md`, `render.yaml`.
- Disallowed: production mutations to n8n; touching other apps' tables; new runtime deps; refactors outside the workflows tab.

## Risks / Assumptions
- Shared Supabase project → strictly `n8nmon_`-prefixed tables.
- Read-only n8n this slice; no workflow writes.
- v1 scoring uses neutral proxies for signals not visible via REST list (error-handling nodes, credentials, cost); paused workflows score low (acceptable, refine later).

## Verification Steps
- `npm test` (12 pass) · `npm run build` (green) · gitleaks CI.
- Live read pipeline proven against websiseo (250 workflows).
- DB-write sync verifies once migration applied + service-role key set: `npm run sync:n8n` then check `select count(*) from n8nmon_workflows`.

## Slices shipped on this branch (PR #5)
- [x] Slice 1 — read-only sync + portfolio + health scoring + security baseline
- [x] Slice 2 — Overview KPIs + Error Center + alerts (Telegram/email)
- [x] Slice 3 — safe operator actions (export, docs, tasks, gated activate/deactivate)
- [x] Slice 4 — Template Library + AI Builder + AI failure analysis
- [x] Slice 5 — SEO Automation Packs (catalog + run model + trigger)
- [x] Slice 6 — Business Results/ROI + exportable reports
- [x] Slice 7 — hardening: env/render docs, runbooks, README, final verification

## Review
- Migrations 0001–0004 APPLIED to wtpczvyupmavzrxisvcm (all namespaced n8nmon_*, RLS on).
- Verification: `npm run build` green; 32 unit tests pass; live read pipeline (250 workflows)
  + live getWorkflow/docs (74-node workflow) proven against websiseo.
- Follow-ups (owner): set `SUPABASE_SERVICE_ROLE_KEY` + optional feature keys in Render to
  light up synced/AI/alert/pack data; ROTATE the n8n key shared in chat; review + merge PR #5.
