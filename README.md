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
- ✅ Workflows tab (6 workflows with status)
- ✅ URLs Previewer (screenshots, WordPress, sheets)
- ✅ KW Research (projects, SERP analysis, cannibalization)
- ✅ Link Building (campaigns, scoring, risk model)
- ✅ Analytics (stats, activity, system status)
- ✅ SEO Tools (integrations, API config)

## Environment Setup

Required in Render Dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://wtpczvyupmavzrxisvcm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Optional for extra features:
```
N8N_API_KEY=your-n8n-key
FIRECRAWL_API_KEY=your-firecrawl-key
OPENAI_API_KEY=your-openai-key
```

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
