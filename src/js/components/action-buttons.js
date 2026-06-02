export function renderActionButtons(workflow) {
  return `
    <div class="action-buttons">
      <button class="action-btn action-run" data-workflow-id="${workflow.id}" data-action="run" title="Run Now">
        ▶️
      </button>
      <button class="action-btn action-toggle" data-workflow-id="${workflow.id}" data-action="${workflow.active ? 'pause' : 'activate'}" title="${workflow.active ? 'Pause' : 'Activate'}">
        ${workflow.active ? '⏸️' : '▶️'}
      </button>
      <button class="action-btn action-retry" data-workflow-id="${workflow.id}" data-action="retry" title="Retry Last Failed">
        🔄
      </button>
    </div>
  `;
}

export function initActionButtons(apiClient) {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    
    const workflowId = btn.dataset.workflowId;
    const action = btn.dataset.action;
    
    btn.disabled = true;
    btn.style.opacity = '0.5';
    
    try {
      let success = false;
      switch (action) {
        case 'run':
          success = await apiClient.runWorkflow(workflowId);
          break;
        case 'pause':
          success = await apiClient.deactivateWorkflow(workflowId);
          break;
        case 'activate':
          success = await apiClient.activateWorkflow(workflowId);
          break;
        case 'retry':
          // Retry is just run for now
          success = await apiClient.runWorkflow(workflowId);
          break;
      }
      
      if (success) {
        btn.style.background = 'var(--success)';
        setTimeout(() => {
          btn.style.background = '';
          btn.disabled = false;
          btn.style.opacity = '1';
        }, 2000);
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      btn.style.background = 'var(--error)';
      setTimeout(() => {
        btn.style.background = '';
        btn.disabled = false;
        btn.style.opacity = '1';
      }, 2000);
      console.error('Action failed:', error);
    }
  });
}
