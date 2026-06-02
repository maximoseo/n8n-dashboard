import { LOCALE } from './utils/constants.js';
import { formatDateTime } from './utils/helpers.js';
import { calculateExecutionStats, executionsData } from './stores/execution-store.js';
import { renderDonutChart, renderTimeline } from './charts/execution-chart.js';
import { renderWorkflows } from './components/workflow-card.js';
import { initThemeToggle } from './components/theme-toggle.js';
import { initSearch } from './components/search.js';

/**
 * Process data and update the dashboard
 * Orchestrates stats calculation, DOM updates, and rendering
 */
function processData() {
  const stats = calculateExecutionStats();
  const executions = executionsData.data || [];

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
 * Initialize the application
 */
function init() {
  initThemeToggle();
  initRefreshButton();
  initSearch();
  processData();
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
