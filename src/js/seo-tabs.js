const DASHBOARDS = {
  n8n: { title: 'n8n Dashboard - MaximoSEO', favicon: '/favicon.ico' },
  urls: { title: 'URLs Previewer · n8n Dashboard', favicon: '/icons/urls-previewer.svg', healthUrl: 'https://urls-previewer.maximo-seo.ai/api/health', label: 'URLs Previewer' },
  kw: { title: 'KW Research · n8n Dashboard', favicon: '/icons/kw-research.svg', healthUrl: 'https://kw-research.maximo-seo.ai/api/health', label: 'KW Research' },
  links: { title: 'Link Building · n8n Dashboard', favicon: '/favicon.svg', label: 'Link Building' }
};

const KW_QUEUE_KEY = 'n8nDashboard.kwResearchBriefs.v1';
const URL_BATCH_KEY = 'n8nDashboard.urlPreviewBatches.v1';
const LB_QUEUE_KEY = 'n8nDashboard.linkBuildingCampaigns.v1';
const PAPERCLIP_LINK_BUILDING_URL = 'http://127.0.0.1:3100/LIN/dashboard';

const LINK_TYPE_LABELS = {
  'editorial': 'Editorial',
  'guest-post': 'Guest post',
  'digital-pr': 'Digital PR',
  'resource-page': 'Resource page',
  'broken-link': 'Broken-link',
  'unlinked-mention': 'Unlinked mention',
  'directory': 'Directory / citation',
  'partner': 'Partner / community',
  'niche-edit': 'Niche edit',
  'sponsored': 'Sponsored',
  'ugc': 'UGC / forum'
};
const LINK_TIER_LABELS = {
  tier1: 'Tier 1 authority',
  tier2: 'Tier 2 topical',
  tier3: 'Tier 3 foundational / local',
  reclamation: 'Reclamation'
};
const LINK_ATTR_LABELS = {
  follow: 'rel=follow',
  nofollow: 'rel=nofollow',
  sponsored: 'rel=sponsored',
  ugc: 'rel=ugc'
};

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return Array.from(document.querySelectorAll(selector)); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}
function normalizeUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
function extractUrls(text) {
  return Array.from(new Set(String(text || '')
    .split(/[\s,]+/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(normalizeUrl)
    .filter(url => /^https?:\/\//i.test(url))));
}
function splitList(text) {
  return String(text || '').split(/\n|,/).map(v => v.trim()).filter(Boolean);
}
function loadJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function setProductChrome(tab) {
  const dashboard = DASHBOARDS[tab] || DASHBOARDS.n8n;
  document.title = dashboard.title;
  const icon = document.getElementById('dynamicFavicon') || document.querySelector('link[rel="icon"]');
  if (icon) icon.href = dashboard.favicon;
}

function activateProductTab(tab) {
  $$('.seo-tab').forEach(button => {
    const active = button.dataset.productTab === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  $$('.seo-product-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.productPanel === tab));
  setProductChrome(tab);
}

function renderHealth(statuses = {}) {
  const target = $('#seoHealthGrid');
  if (!target) return;
  const items = [
    { id: 'urls', name: 'URLs Previewer', status: statuses.urls || 'Open in protected source app', url: 'https://urls-previewer.maximo-seo.ai/sites' },
    { id: 'kw', name: 'KW Research', status: statuses.kw || 'Auth required in source app', url: 'https://kw-research.maximo-seo.ai/dashboard' },
    { id: 'links', name: 'Paperclip LINK BUILDING', status: 'Local Paperclip company · prefix LIN', url: PAPERCLIP_LINK_BUILDING_URL },
    { id: 'n8n', name: 'n8n Monitor', status: 'Active host tab', url: location.origin }
  ];
  target.innerHTML = items.map(item => `<a class="seo-health-card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(item.name)}</span><strong>${escapeHtml(item.status)}</strong></a>`).join('');
}

async function probeHealth() {
  const statuses = {};
  await Promise.all(['urls', 'kw'].map(async key => {
    try {
      await fetch(DASHBOARDS[key].healthUrl, { mode: 'no-cors', cache: 'no-store' });
      statuses[key] = key === 'urls' ? 'Service reachable · opens externally' : 'Service reachable · auth protected';
    } catch {
      statuses[key] = 'Open source dashboard to verify';
    }
  }));
  renderHealth(statuses);
}

function prepareUrlBatch() {
  const urls = extractUrls($('#urlBatchInput')?.value || '');
  const device = $('#urlBatchDevice')?.value || '393x852';
  const target = $('#urlBatchResult');
  if (!urls.length) {
    target.innerHTML = '<p class="empty-state">Paste at least one valid URL.</p>';
    return;
  }
  const batches = loadJson(URL_BATCH_KEY);
  const batch = { id: `URL-BATCH-${Date.now()}`, urls, device, createdAt: new Date().toISOString() };
  batches.unshift(batch);
  saveJson(URL_BATCH_KEY, batches.slice(0, 20));
  target.innerHTML = `<div class="prepared-head"><strong>${urls.length} URLs prepared</strong><span>${escapeHtml(device)}</span></div>` + urls.map(url => `<div class="prepared-row"><span>${escapeHtml(url)}</span><a href="https://urls-previewer.maximo-seo.ai/screenshots" target="_blank" rel="noopener noreferrer">Open previewer</a></div>`).join('');
}

function renderKwQueue() {
  const target = $('#kwQueueResult');
  if (!target) return;
  const queue = loadJson(KW_QUEUE_KEY);
  target.innerHTML = queue.length ? queue.map(item => `<div class="prepared-row"><span><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.homepage || 'No homepage')} · ${item.keywords.length} seed keywords</small></span><a href="https://kw-research.maximo-seo.ai/dashboard" target="_blank" rel="noopener noreferrer">Open KW Research</a></div>`).join('') : '<p class="empty-state">No local keyword briefs queued yet.</p>';
}

function queueKwProject() {
  const name = ($('#kwProjectName')?.value || '').trim();
  const homepage = normalizeUrl($('#kwHomepageUrl')?.value || '');
  const keywords = String($('#kwSeedKeywords')?.value || '').split(/\n|,/).map(v => v.trim()).filter(Boolean);
  if (!name || !keywords.length) {
    $('#kwQueueResult').innerHTML = '<p class="empty-state">Add a project name and at least one seed keyword.</p>';
    return;
  }
  const queue = loadJson(KW_QUEUE_KEY);
  queue.unshift({ id: `KW-${Date.now()}`, name, homepage, keywords, createdAt: new Date().toISOString() });
  saveJson(KW_QUEUE_KEY, queue.slice(0, 20));
  $('#kwProjectName').value = '';
  $('#kwHomepageUrl').value = '';
  $('#kwSeedKeywords').value = '';
  renderKwQueue();
}

// -------- Link Building ----------

export function scoreLinkCampaign(campaign) {
  const type = campaign.linkType;
  const tier = campaign.linkTier;
  const attr = campaign.linkAttr;
  const hasTopic = Boolean((campaign.topic || '').trim());
  const hasTarget = Boolean((campaign.targetUrl || '').trim());
  const hasKeywords = Array.isArray(campaign.keywords) && campaign.keywords.length > 0;

  let quality = 50;
  const flags = [];

  const typeBonus = {
    'editorial': 22,
    'digital-pr': 22,
    'broken-link': 18,
    'unlinked-mention': 20,
    'resource-page': 16,
    'guest-post': 12,
    'partner': 8,
    'directory': 4,
    'niche-edit': -8,
    'sponsored': -10,
    'ugc': -12
  };
  quality += typeBonus[type] ?? 0;

  const tierBonus = { tier1: 14, tier2: 8, tier3: 2, reclamation: 10 };
  quality += tierBonus[tier] ?? 0;

  if (hasTopic) quality += 6; else flags.push('Missing topic / niche reduces topical relevance signals.');
  if (hasTarget) quality += 8; else flags.push('No target page URL — backlink cannot be evaluated for fit.');
  if (hasKeywords) quality += 6; else flags.push('No anchor / keyword themes — outreach lacks angle.');

  if (attr === 'follow' && (type === 'editorial' || type === 'digital-pr' || type === 'broken-link' || type === 'unlinked-mention' || type === 'resource-page')) {
    quality += 6;
  }

  // Policy & risk
  let risk = 'Low';
  if (type === 'sponsored' && attr !== 'sponsored') {
    flags.push('Paid / sponsored link must use rel="sponsored" to comply with Google link spam policy.');
    risk = 'High';
    quality -= 20;
  }
  if (type === 'ugc' && attr !== 'ugc' && attr !== 'nofollow') {
    flags.push('UGC / forum link should use rel="ugc" or rel="nofollow".');
    risk = 'High';
    quality -= 15;
  }
  if (type === 'niche-edit') {
    flags.push('Niche edits carry elevated risk — verify the host site is not part of a link scheme.');
    if (risk !== 'High') risk = 'Medium';
    quality -= 5;
  }
  if (type === 'sponsored' && risk !== 'High') risk = 'Medium';

  if (!hasTopic || !hasTarget || !hasKeywords) {
    if (risk === 'Low') risk = 'Medium';
  }

  quality = Math.max(0, Math.min(100, Math.round(quality)));

  const reviewNeeded = risk !== 'Low' || quality < 55;

  let nextAction;
  if (risk === 'High') {
    nextAction = 'Fix rel attribute or reclassify before outreach.';
  } else if (!hasTarget) {
    nextAction = 'Confirm target page URL before logging in Paperclip.';
  } else if (!hasKeywords) {
    nextAction = 'Define anchor themes (branded, partial, naked) before pitching.';
  } else if (type === 'broken-link') {
    nextAction = 'Verify broken URL and prepare replacement asset pitch.';
  } else if (type === 'unlinked-mention') {
    nextAction = 'Email the author with reclaim request and exact mention URL.';
  } else if (type === 'digital-pr') {
    nextAction = 'Pitch linkable asset to topical journalists in Paperclip outreach.';
  } else if (type === 'resource-page') {
    nextAction = 'Send personalized add-to-list pitch with proof of value.';
  } else if (type === 'editorial' || type === 'guest-post') {
    nextAction = 'Send editorial pitch; respect publication guidelines and anchor diversity.';
  } else if (type === 'directory') {
    nextAction = 'Confirm NAP consistency, submit citation, log in Paperclip.';
  } else {
    nextAction = 'Open Paperclip LINK BUILDING and start outreach log.';
  }

  return { quality, risk, flags, nextAction, reviewNeeded };
}

function renderLinkQueue() {
  const target = $('#lbQueueResult');
  if (!target) return;
  const queue = loadJson(LB_QUEUE_KEY);
  if (!queue.length) {
    target.innerHTML = '<p class="empty-state">No link building campaigns queued yet. Add a site above to score your first opportunity.</p>';
    return;
  }
  target.innerHTML = queue.map(item => {
    const s = item.score || scoreLinkCampaign(item);
    const riskClass = `lb-risk-${s.risk.toLowerCase()}`;
    const flagsHtml = s.flags && s.flags.length
      ? `<ul class="lb-flags">${s.flags.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`
      : '';
    const keywordsLine = (item.keywords || []).slice(0, 6).map(escapeHtml).join(', ');
    const targetLine = item.targetUrl ? `<a href="${escapeHtml(item.targetUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.targetUrl)}</a>` : '<em>no target page</em>';
    return `<div class="lb-row">
      <div class="lb-row-head">
        <div>
          <strong>${escapeHtml(item.siteName || 'Untitled site')}</strong>
          <small> · ${escapeHtml(LINK_TYPE_LABELS[item.linkType] || item.linkType)} · ${escapeHtml(LINK_TIER_LABELS[item.linkTier] || item.linkTier)} · ${escapeHtml(LINK_ATTR_LABELS[item.linkAttr] || item.linkAttr)}</small>
        </div>
        <div class="lb-badges">
          <span class="lb-score">${s.quality}/100</span>
          <span class="lb-risk ${riskClass}">Risk: ${escapeHtml(s.risk)}</span>
          ${s.reviewNeeded ? '<span class="lb-review">Review</span>' : ''}
        </div>
      </div>
      <div class="lb-row-meta">
        <span>Target: ${targetLine}</span>
        <span>Topic: ${escapeHtml(item.topic || '—')}</span>
        ${keywordsLine ? `<span>Anchors: ${keywordsLine}</span>` : ''}
      </div>
      <div class="lb-next-action"><strong>Next:</strong> ${escapeHtml(s.nextAction)}</div>
      ${flagsHtml}
      <div class="lb-row-actions">
        <a class="product-btn" href="${escapeHtml(PAPERCLIP_LINK_BUILDING_URL)}" target="_blank" rel="noopener noreferrer">Open in Paperclip</a>
        <button class="product-btn" type="button" data-seo-action="copy-link-campaign" data-id="${escapeHtml(item.id)}">Copy brief</button>
        <button class="product-btn" type="button" data-seo-action="remove-link-campaign" data-id="${escapeHtml(item.id)}">Remove</button>
      </div>
    </div>`;
  }).join('');
}

function addLinkCampaign() {
  const siteName = ($('#lbSiteName')?.value || '').trim();
  const homepage = normalizeUrl($('#lbHomepageUrl')?.value || '');
  const targetUrl = normalizeUrl($('#lbTargetUrl')?.value || '');
  const topic = ($('#lbTopic')?.value || '').trim();
  const keywords = splitList($('#lbKeywords')?.value || '');
  const linkType = $('#lbLinkType')?.value || 'editorial';
  const linkTier = $('#lbLinkTier')?.value || 'tier2';
  const linkAttr = $('#lbLinkAttr')?.value || 'follow';
  const notes = ($('#lbNotes')?.value || '').trim();

  if (!siteName) {
    $('#lbQueueResult').innerHTML = '<p class="empty-state">Add a site / client name to queue a campaign.</p>';
    return;
  }

  const campaign = {
    id: `LB-${Date.now()}`,
    siteName,
    homepage,
    targetUrl,
    topic,
    keywords,
    linkType,
    linkTier,
    linkAttr,
    notes,
    createdAt: new Date().toISOString()
  };
  campaign.score = scoreLinkCampaign(campaign);

  const queue = loadJson(LB_QUEUE_KEY);
  queue.unshift(campaign);
  saveJson(LB_QUEUE_KEY, queue.slice(0, 50));

  $('#lbSiteName').value = '';
  $('#lbHomepageUrl').value = '';
  $('#lbTargetUrl').value = '';
  $('#lbTopic').value = '';
  $('#lbKeywords').value = '';
  $('#lbNotes').value = '';
  renderLinkQueue();
}

function removeLinkCampaign(id) {
  const queue = loadJson(LB_QUEUE_KEY).filter(item => item.id !== id);
  saveJson(LB_QUEUE_KEY, queue);
  renderLinkQueue();
}

function campaignBrief(campaign) {
  const s = campaign.score || scoreLinkCampaign(campaign);
  const lines = [
    `Link Building Campaign · ${campaign.siteName}`,
    `Homepage: ${campaign.homepage || '—'}`,
    `Target page: ${campaign.targetUrl || '—'}`,
    `Topic / niche: ${campaign.topic || '—'}`,
    `Anchor themes: ${(campaign.keywords || []).join(', ') || '—'}`,
    `Link type: ${LINK_TYPE_LABELS[campaign.linkType] || campaign.linkType}`,
    `Tier: ${LINK_TIER_LABELS[campaign.linkTier] || campaign.linkTier}`,
    `Attribute: ${LINK_ATTR_LABELS[campaign.linkAttr] || campaign.linkAttr}`,
    `Quality score: ${s.quality}/100 · Risk: ${s.risk}`,
    `Next action: ${s.nextAction}`
  ];
  if (s.flags && s.flags.length) {
    lines.push('Risk flags:');
    s.flags.forEach(f => lines.push(` - ${f}`));
  }
  if (campaign.notes) lines.push(`Notes: ${campaign.notes}`);
  return lines.join('\n');
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* noop */ }
  document.body.removeChild(ta);
  return Promise.resolve();
}

function copyLinkCampaign(id) {
  const campaign = loadJson(LB_QUEUE_KEY).find(item => item.id === id);
  if (!campaign) return;
  copyToClipboard(campaignBrief(campaign));
}

function copyAllLinkBrief() {
  const queue = loadJson(LB_QUEUE_KEY);
  if (!queue.length) return;
  const text = queue.map(campaignBrief).join('\n\n---\n\n');
  copyToClipboard(text);
}

function exportLinkCampaigns() {
  const queue = loadJson(LB_QUEUE_KEY);
  const blob = new Blob([JSON.stringify(queue, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `link-building-campaigns-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function generateLinkPlan() {
  const queue = loadJson(LB_QUEUE_KEY);
  const target = $('#lbQueueResult');
  if (!target) return;
  if (!queue.length) {
    target.innerHTML = '<p class="empty-state">Queue at least one campaign before generating a plan.</p>';
    return;
  }
  const scored = queue.map(c => ({ ...c, score: c.score || scoreLinkCampaign(c) }));
  const total = scored.length;
  const avg = Math.round(scored.reduce((sum, c) => sum + c.score.quality, 0) / total);
  const high = scored.filter(c => c.score.risk === 'High').length;
  const review = scored.filter(c => c.score.reviewNeeded).length;
  const ranked = [...scored].sort((a, b) => b.score.quality - a.score.quality).slice(0, 5);

  const plan = document.createElement('div');
  plan.className = 'lb-plan';

  const heading = document.createElement('h5');
  heading.textContent = `Link building plan · ${total} campaign${total === 1 ? '' : 's'}`;
  plan.appendChild(heading);

  const stats = document.createElement('ul');
  [
    ['Average quality score: ', `${avg}/100`],
    ['Campaigns needing review: ', String(review)],
    ['High-risk policy flags: ', String(high)]
  ].forEach(([label, value]) => {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(label));
    const strong = document.createElement('strong');
    strong.textContent = value;
    li.appendChild(strong);
    stats.appendChild(li);
  });
  plan.appendChild(stats);

  const subHeading = document.createElement('h6');
  subHeading.textContent = 'Top opportunities';
  plan.appendChild(subHeading);

  const list = document.createElement('ol');
  ranked.forEach(c => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = c.siteName || 'Untitled site';
    li.appendChild(strong);
    const typeLabel = LINK_TYPE_LABELS[c.linkType] || c.linkType;
    li.appendChild(document.createTextNode(` — ${typeLabel} · ${c.score.quality}/100 · ${c.score.nextAction}`));
    list.appendChild(li);
  });
  plan.appendChild(list);

  target.insertBefore(plan, target.firstChild);
}

export function initSeoProductTabs() {
  renderHealth();
  renderKwQueue();
  renderLinkQueue();
  probeHealth();
  $$('.seo-tab').forEach(button => button.addEventListener('click', () => activateProductTab(button.dataset.productTab)));
  window.addEventListener('seoProductTabRequested', event => activateProductTab(event.detail?.tab || 'urls'));
  document.body.addEventListener('click', event => {
    const button = event.target.closest('[data-seo-action]');
    if (!button) return;
    const action = button.dataset.seoAction;
    if (action === 'prepare-url-batch') prepareUrlBatch();
    if (action === 'queue-kw-project') queueKwProject();
    if (action === 'clear-kw-queue') { saveJson(KW_QUEUE_KEY, []); renderKwQueue(); }
    if (action === 'add-link-campaign') addLinkCampaign();
    if (action === 'clear-link-campaigns') { saveJson(LB_QUEUE_KEY, []); renderLinkQueue(); }
    if (action === 'remove-link-campaign') removeLinkCampaign(button.dataset.id);
    if (action === 'copy-link-campaign') copyLinkCampaign(button.dataset.id);
    if (action === 'copy-link-brief') copyAllLinkBrief();
    if (action === 'export-link-campaigns') exportLinkCampaigns();
    if (action === 'generate-link-plan') generateLinkPlan();
  });
}
