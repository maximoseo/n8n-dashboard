import { filterWorkflows, getWorkflows } from '../stores/workflow-store.js';
import { getWorkflowStats, executionsData } from '../stores/execution-store.js';
import { formatDate, calculateSuccessRate } from '../utils/helpers.js';
import { renderHealthBadge } from './health-badge.js';
import { renderActionButtons } from './action-buttons.js';
import { getN8nWorkflowUrl, getGoogleSheetUrl, hasGoogleSheet } from '../utils/workflow-links.js';

/**
 * Render workflow cards to the grid
 */
export function renderWorkflows(searchQuery = '', filter = 'all', customWorkflows = null) {
  const container = document.getElementById('workflowsGrid');
  if (!container) return;

  const workflows = getWorkflows();
  const filtered = customWorkflows || filterWorkflows(searchQuery, filter);
  const workflowStats = getWorkflowStats();

  // Update count
  const countElement = document.getElementById('workflowCount');
  if (countElement) {
    countElement.textContent = `(${filtered.length} of ${workflows.length})`;
  }

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
 * Render a single workflow card - Symmetric Design
 */
function renderWorkflowCard(wf, stats = { total: 0, success: 0, failed: 0 }) {
  const successRate = calculateSuccessRate(stats.success, stats.total);
  const tags = (wf.tags || []).slice(0, 2).map(t => `<span class="tag">${t.name}</span>`).join('');
  const updatedDate = formatDate(wf.updatedAt);
  const executions = executionsData.data || [];
  
  const n8nUrl = getN8nWorkflowUrl(wf.id);
  const sheetUrl = getGoogleSheetUrl(wf);
  const hasSheet = sheetUrl !== null;
  
  // Success rate color
  const rateColor = successRate >= 90 ? 'var(--success)' : successRate >= 70 ? 'var(--warning)' : 'var(--error)';

  return `
    <div class="workflow-card">
      <div class="workflow-header">
        <div class="workflow-info">
          <div class="workflow-name">${wf.name}</div>
          <div class="workflow-id">🔗 ${wf.id}</div>
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

      <div style="display:flex;align-items:center;gap:8px;padding:0 4px;">
        <div style="flex:1;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
          <div style="width:${successRate}%;height:100%;background:${rateColor};border-radius:3px;transition:width 0.5s;"></div>
        </div>
        <span style="font-size:0.75rem;font-weight:700;color:${rateColor};">${successRate}%</span>
      </div>

      ${renderActionButtons(wf)}

      <div class="workflow-links">
        <a href="${n8nUrl}" target="_blank" rel="noopener noreferrer" class="workflow-link-btn n8n-link">
          <span class="link-icon">⚙️</span>
          <span>Open in n8n</span>
        </a>
        <a href="${sheetUrl || '#'}" target="_blank" rel="noopener noreferrer" class="workflow-link-btn sheet-link ${!hasSheet ? 'disabled' : ''}" ${!hasSheet ? 'title="No sheet linked"' : ''}>
          <span class="link-icon">📊</span>
          <span>${hasSheet ? 'View Sheet' : 'No Sheet'}</span>
        </a>
        <button class="workflow-link-btn edit-link" onclick="openWorkflowEditor('${wf.id}')">
          <span class="link-icon">✏️</span>
          <span>Edit Workflow</span>
        </button>
      </div>

      <div class="workflow-footer">
        <div class="workflow-tags">${tags || '<span style="color: var(--text-muted); font-size: 0.75rem;">No tags</span>'}</div>
        <div class="workflow-updated">${updatedDate}</div>
      </div>
    </div>
  `;
}

// Global function to open workflow editor
window.openWorkflowEditor = async function(workflowId) {
  // Dynamic import to avoid circular dependencies
  const { WorkflowEditor } = await import('./workflow-editor.js');
  
  // Create editor container
  let editorContainer = document.getElementById('workflow-editor-container');
  if (!editorContainer) {
    editorContainer = document.createElement('div');
    editorContainer.id = 'workflow-editor-container';
    document.body.appendChild(editorContainer);
  }
  
  const editor = new WorkflowEditor(editorContainer);
  await editor.load(workflowId);
};
