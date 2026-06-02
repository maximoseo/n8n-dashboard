import { LOCALE } from './utils/constants.js';
import { formatDateTime } from './utils/helpers.js';
import { calculateExecutionStats, executionsData } from './stores/execution-store.js';
import { workflowsData } from './stores/workflow-store.js';
import { renderDonutChart, renderTimeline } from './charts/execution-chart.js';
import { renderWorkflows } from './components/workflow-card.js';
import { initThemeToggle } from './components/theme-toggle.js';
import { initSearch } from './components/search.js';
import { renderHealthBadge } from './components/health-badge.js';
import { renderAnomalyPanel } from './components/anomaly-panel.js';
import { renderLiveCounter } from './components/live-counter.js';
import { calculateHealthScore } from './utils/health-score.js';
import { detectAnomalies } from './utils/anomaly-detector.js';
import { parseQuery } from './utils/nlp-query.js';
import { renderHeatmap } from './charts/heatmap-chart.js';
import { renderTrendChart } from './charts/trend-chart.js';
import { renderSLACard } from './utils/sla-tracker.js';
import { renderCostCard } from './utils/cost-estimator.js';
import { renderActionButtons, initActionButtons } from './components/action-buttons.js';
import { N8nClient } from './api/n8n-client.js';
import { isAuthenticated, showAuthGate } from './utils/auth.js';

/**
 * Process data and update the dashboard
 */
function processData() {
  const stats = calculateExecutionStats();
  const executions = executionsData.data || [];
  const workflows = workflowsData.data || [];

  // Update stats in DOM
  document.getElementById('totalWorkflows').textContent = stats.totalWorkflows;
  document.getElementById('activeWorkflows').textContent = stats.activeWorkflows;
  document.getElementById('inactiveWorkflows').textContent = stats.inactiveWorkflows;
  document.getElementById('recentExecutions').textContent = stats.recentExecutions;
  document.getElementById('successfulExecutions').textContent = stats.successfulExecutions;
  document.getElementById('failedExecutions').textContent = stats.failedExecutions;

  // Update timestamp
  const now = new Date();
  const timestamp = now.toLocaleString(LOCALE);
  document.getElementById('lastUpdated').textContent = `Last updated: ${timestamp}`;
  document.getElementById('footerTimestamp').textContent = timestamp;

  // Render donut chart
  renderDonutChart(stats.successfulExecutions, stats.failedExecutions, stats.recentExecutions);

  // Render timeline
  renderTimeline(executions);

  // Render workflows
  renderWorkflows('', 'all');

  // AI Features
  renderAnomalyPanel(workflows, executions);
  renderLiveCounter(executions);

  // Analytics
  renderSLACard(executions);
  renderCostCard(workflows, executions);
  renderTrendChart(executions);
  renderHeatmap(executions);
}

/**
 * Initialize refresh button
 */
function initRefreshButton() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (!refreshBtn) return;

  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('loading');
    setTimeout(() => {
      location.reload();
    }, 1000);
  });
}

/**
 * Initialize NLP query
 */
function initNLPQuery() {
  const searchInput = document.getElementById('searchInput');
  const nlpResult = document.getElementById('nlpResult');
  const nlpMessage = document.getElementById('nlpMessage');
  const nlpClear = document.getElementById('nlpClear');
  
  if (!searchInput || !nlpResult || !nlpMessage || !nlpClear) return;

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (!query) return;

      const workflows = workflowsData.data || [];
      const executions = executionsData.data || [];
      const result = parseQuery(query, workflows, executions);

      if (result.type === 'filter' && result.workflows.length > 0) {
        nlpMessage.textContent = result.message;
        nlpResult.style.display = 'flex';
        renderWorkflows('', 'all', result.workflows);
      } else {
        nlpMessage.textContent = `No results for "${query}"`;
        nlpResult.style.display = 'flex';
      }
    }
  });

  nlpClear.addEventListener('click', () => {
    nlpResult.style.display = 'none';
    searchInput.value = '';
    renderWorkflows('', 'all');
  });
}

/**
 * Initialize the application
 */
function init() {
  // Check authentication
  if (!isAuthenticated()) {
    showAuthGate();
    return;
  }
  
  initThemeToggle();
  initRefreshButton();
  initSearch();
  initNLPQuery();
  
  // Initialize API client for actions (if API key is available)
  const apiKey = localStorage.getItem('n8n_api_key') || window.N8N_API_KEY;
  if (apiKey) {
    const apiClient = new N8nClient(apiKey);
    initActionButtons(apiClient);
  }
  
  processData();
  
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
