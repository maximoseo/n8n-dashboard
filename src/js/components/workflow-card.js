import { filterWorkflows, getWorkflows } from '../stores/workflow-store.js';
import { getWorkflowStats, executionsData } from '../stores/execution-store.js';
import { formatDate, calculateSuccessRate } from '../utils/helpers.js';
import { renderHealthBadge } from './health-badge.js';
import { renderActionButtons } from './action-buttons.js';
import { getN8nWorkflowUrl, getGoogleSheetUrl, hasGoogleSheet } from '../utils/workflow-links.js';

/**
 * Render workflow cards to the grid
 * @param {string} searchQuery - Search term to filter by
 * @param {string} filter - Status filter ('all', 'active', 'inactive')
 */
export function renderWorkflows(searchQuery = '', filter = 'all') {
  const container = document.getElementById('workflowsGrid');
  if (!container) return;

  const workflows = getWorkflows();
  const filtered = filterWorkflows(searchQuery, filter);
  const workflowStats = getWorkflowStats();

  // Update count
  const countElement = document.getElementById('workflowCount');
  if (countElement) {
    countElement.textContent = `(${filtered.length} of ${workflows.length})`;
  }

  // Render cards
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">No workflows found</div>
        <div style="color: var(--text-muted);">Try adjusting your search or filters</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(wf => renderWorkflowCard(wf, workflowStats[wf.id])).join('');
}

/**
 * Render a single workflow card
 * @param {Object} wf - Workflow object
 * @param {Object} stats - Execution stats for this workflow
 * @returns {string} HTML string for the card
 */
function renderWorkflowCard(wf, stats = { total: 0, success: 0, failed: 0 }) {
  const successRate = calculateSuccessRate(stats.success, stats.total);
  const tags = (wf.tags || []).slice(0, 3).map(t => `<span class="tag">${t.name}</span>`).join('');
  const updatedDate = formatDate(wf.updatedAt);
  const executions = executionsData.data || [];
  
  // Generate links
  const n8nUrl = getN8nWorkflowUrl(wf.id);
  const sheetUrl = getGoogleSheetUrl(wf);
  const hasSheet = sheetUrl !== null;

  return `
    <div class="workflow-card">
      <div class="workflow-header">
        <div>
          <div class="workflow-name">${wf.name}</div>
          <div class="workflow-id">${wf.id}</div>
        </div>
        <div class="workflow-badges">
          <div class="status-badge ${wf.active ? 'active' : 'inactive'}">
            <span class="status-dot"></span>
            ${wf.active ? 'Active' : 'Inactive'}
          </div>
          ${renderHealthBadge(wf, executions)}
        </div>
      </div>
      
      <div class="workflow-stats">
        <div class="workflow-stat">
          <div class="workflow-stat-value">${stats.total}</div>
          <div class="workflow-stat-label">Runs</div>
        </div>
        <div class="workflow-stat">
          <div class="workflow-stat-value" style="color: var(--success);">${stats.success}</div>
          <div class="workflow-stat-label">Success</div>
        </div>
        <div class="workflow-stat">
          <div class="workflow-stat-value" style="color: var(--error);">${stats.failed}</div>
          <div class="workflow-stat-label">Failed</div>
        </div>
      </div>

      ${renderActionButtons(wf)}

      <div class="workflow-links">
        <a href="${n8nUrl}" target="_blank" rel="noopener noreferrer" class="workflow-link-btn n8n-link">
          <span class="link-icon">⚙️</span>
          <span>Open in n8n</span>
        </a>
        ${hasSheet ? `
          <a href="${sheetUrl}" target="_blank" rel="noopener noreferrer" class="workflow-link-btn sheet-link">
            <span class="link-icon">📊</span>
            <span>View Sheet</span>
          </a>
        ` : ''}
      </div>

      <div class="workflow-footer">
        <div class="workflow-tags">${tags || '<span style="color: var(--text-muted); font-size: 0.75rem;">No tags</span>'}</div>
        <div class="workflow-updated">${updatedDate}</div>
      </div>
    </div>
  `;
}
