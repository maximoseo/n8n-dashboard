# n8n Dashboard - MaximoSEO

Modern dashboard with Supabase Auth, dark theme, and 6 SEO modules.

## Quick Deploy to Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect GitHub and select `maximoseo/n8n-dashboard-improved`
4. Click **Deploy** (render.yaml auto-configures everything)

## Working APIs & MCPs

### Essential (Required)
| Service | Status |
|---------|--------|
| Supabase Auth | ✅ Active |
| Render Deploy | ✅ Active |
| GitHub | ✅ Active |

### N8N Integration
| Service | Purpose |
|---------|---------|
| n8n Cloud (websiseo.app.n8n.cloud) | Workflow execution |
| n8n MCP | Agent integration |
| Private n8n (maximoseo.app.n8n.cloud) | Internal workflows |

### AI APIs (Optional Features)
| Provider | Use Case |
|----------|----------|
| Anthropic Claude | Content generation |
| OpenAI | GPT features |
| OpenRouter | Multi-model access |
| Google Gemini | Image/text analysis |
| xAI Grok | X/Twitter data |

### Scraping & Browser Tools
| Tool | Feature |
|------|---------|
| Firecrawl | Web scraping |
| Browserless | Screenshots |
| Browser Use | Browser automation |

### SEO Tools MCPs
```json
{
  "n8n_mcp": "https://websiseo.app.n8n.cloud/mcp-server/http",
  "browserless": "https://mcp.browserless.io/mcp",
  "seo_utils": "http://localhost:19515/mcp",
  "screaming_frog": "http://127.0.0.1:11435/mcp"
}
```

### Other Working APIs
| Service | Purpose |
|---------|---------|
| DataForSEO | SEO data |
| Ahrefs | Backlinks |
| SERP API | SERP data |
| Exa.ai | Neural search |
| Resend | Email |
| Cloudflare | CDN/DNS |

## Dashboard Features

- ✅ Supabase Auth (Email + Google + GitHub OAuth)
- ✅ **Overview** — executive KPI cards + highest-risk workflows
- ✅ **Workflow Portfolio** — real n8n sync, health/risk scores, search/filter, export, docs, gated activate/deactivate
- ✅ **Error Center** — fingerprint clustering, severity, AI failure analysis, alert dispatch (Telegram/email)
- ✅ **Templates & AI Builder** — import workflows as templates; NL → safe workflow spec (draft only)
- ✅ **SEO Packs** — grouped, n8n-orchestrated site analyses with run history
- ✅ **ROI** — estimated business value / hours saved / API cost + MD/CSV/JSON reports
- ✅ URLs Previewer · KW Research · Link Building · Analytics · SEO Tools (existing modules)

> All n8n calls are server-side and read-only by default; writes (activate/deactivate)
> require explicit confirmation + reason + audit. AI receives only redacted input.
> See `docs/RUNBOOKS.md` for operations and `CURRENT_STATE_AUDIT.md` for the audit.

## Environment Setup

Required in Render Dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://wtpczvyupmavzrxisvcm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUPABASE_ANON_KEY]
```

Optional for extra features:
```
N8N_API_KEY=your-n8n-key
FIRECRAWL_API_KEY=your-firecrawl-key
OPENAI_API_KEY=your-openai-key
```

See `.env.example` for the full, documented list (placeholders only — never commit secrets).

### Workflow Portfolio sync (read-only)

The Workflows tab can show real n8n workflows + executions with health/risk
scores, persisted in Supabase (`n8nmon_*` tables). To enable:

1. Apply the migration `supabase/migrations/0001_n8n_core.sql` (Supabase SQL editor or CLI).
2. Set server envs: `N8N_API_KEY`, `N8N_BASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SYNC_SECRET`.
3. Trigger a sync — UI "Sync now" button, or machine/cron:
   ```bash
   SYNC_SECRET=… APP_BASE_URL=https://n8n-dashboard.maximo-seo.ai npm run sync:n8n
   ```

Until a sync runs, the tab gracefully falls back to the live `/api/n8n/workflows` route.
All n8n calls are server-side and **read-only** in this version.

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Links

- **Live URL**: https://n8n-dashboard-3229.onrender.com
- **GitHub**: https://github.com/maximoseo/n8n-dashboard-improved
- **Supabase**: https://wtpczvyupmavzrxisvcm.supabase.co
