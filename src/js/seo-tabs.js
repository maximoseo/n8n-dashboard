const DASHBOARDS = {
  n8n: { title: 'n8n Dashboard - MaximoSEO', favicon: '/favicon.ico' },
  urls: { title: 'URLs Previewer · n8n Dashboard', favicon: '/icons/urls-previewer.svg', healthUrl: 'https://urls-previewer.maximo-seo.ai/api/health', label: 'URLs Previewer' },
  kw: { title: 'KW Research · n8n Dashboard', favicon: '/icons/kw-research.svg', healthUrl: 'https://kw-research.maximo-seo.ai/api/health', label: 'KW Research' }
};

const KW_QUEUE_KEY = 'n8nDashboard.kwResearchBriefs.v1';
const URL_BATCH_KEY = 'n8nDashboard.urlPreviewBatches.v1';

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

export function initSeoProductTabs() {
  renderHealth();
  renderKwQueue();
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
  });
}
