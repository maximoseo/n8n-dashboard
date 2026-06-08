# Operations Runbooks — n8n Automation Command Center

## 0. First-time setup
1. Apply migrations `supabase/migrations/000{1..4}_*.sql` to the Supabase project.
2. Set env (Render): `N8N_API_KEY`, `N8N_BASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SYNC_SECRET`.
   Optional: `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` (AI), `TELEGRAM_BOT_TOKEN`+`TELEGRAM_ALERT_CHAT_ID` / `RESEND_API_KEY`+`ALERT_EMAIL` (alerts), `N8N_SITE_PACK_WEBHOOK_URL` (SEO packs).
3. Trigger the first sync: **Workflows → Sync now**, or `npm run sync:n8n`.

## 1. Workflow failure
1. Open **Error Center**; review clustered failures (severity = blast radius + frequency).
2. Click **AI analysis** on a cluster for a probable root cause + suggested fix (redacted input).
3. If credential/rate-limit/schema, fix at source; for transient issues use **Sync now** and re-check.
4. Click **Check alerts** to dispatch (Telegram/email) if thresholds are breached.
5. Track remediation by creating a task (`POST /api/n8n/tasks`).

## 2. Activate / deactivate a workflow (high-risk)
1. **Workflows** → the **Power** button on a row.
2. A confirm dialog requires a **reason**; the change hits production n8n and is **audited** (`dashboard_audit_log`).
3. Verify the new state after the next sync.

## 3. Credential / API outage
1. **Workflows → Sync status** card shows instance API status (`reachable`/`unreachable`).
2. If unreachable, verify `N8N_API_KEY` validity and n8n availability before retrying.

## 4. New automation request
1. **Templates → AI Builder**: describe the goal → **Generate spec** (a draft plan, never auto-activated).
2. Review credentials/cost/privacy sections; **Save as draft** for the team.
3. Build in n8n from the spec; import the finished workflow back as a template (redacted).

## 5. Full site SEO analysis
1. **SEO Packs**: enter the target domain, pick a pack, **Run**.
2. With `N8N_SITE_PACK_WEBHOOK_URL` set, orchestration is delegated to n8n (shared `correlation_id`); otherwise the run is recorded as `queued`.
3. Track status + scores in **Recent runs**.

## 6. Weekly ops report
- **ROI → Export** (MD/CSV/JSON), or `GET /api/reports?format=md|csv|json`. Hours/cost are labeled estimates.

## Safety invariants
- All n8n calls are server-side; reads are redacted before docs/AI.
- n8n writes (activate/deactivate) require explicit confirm + reason + audit.
- AI receives only redacted, minimal context; specs are drafts, never auto-activated.
