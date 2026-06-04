import { escapeHtml, safeWorkflowName } from './display-safe.js';

export function estimateCosts(workflows, executions) {
  const costs = [];
  
  workflows.forEach(wf => {
    const wfExecs = executions.filter(e => e.workflowId === wf.id);
    if (wfExecs.length === 0) return;
    
    const totalDuration = wfExecs.reduce((sum, e) => {
      if (e.startedAt && e.stoppedAt) {
        return sum + (new Date(e.stoppedAt) - new Date(e.startedAt)) / 1000;
      }
      return sum;
    }, 0);
    
    // Estimate: $0.001 per second of execution
    const cost = totalDuration * 0.001;
    
    costs.push({
      id: wf.id,
      name: safeWorkflowName(wf),
      executions: wfExecs.length,
      totalDuration: Math.round(totalDuration),
      cost: Math.round(cost * 100) / 100
    });
  });
  
  costs.sort((a,b) => b.cost - a.cost);
  
  const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);
  
  return { costs, totalCost: Math.round(totalCost * 100) / 100 };
}

export function renderCostCard(workflows, executions) {
  const { costs, totalCost } = estimateCosts(workflows, executions);
  const container = document.getElementById('costCard');
  if (!container) return;
  
  const top3 = costs.slice(0, 3);
  
  container.innerHTML = `
    <div class="cost-summary">
      <div class="cost-total">$${totalCost.toFixed(2)}</div>
      <div class="cost-label">Estimated Monthly Cost</div>
    </div>
    <div class="cost-breakdown">
      <div class="cost-title">Top 3 Costly Workflows:</div>
      ${top3.map(c => `
        <div class="cost-item">
          <span class="cost-name">${escapeHtml(c.name)}</span>
          <span class="cost-value">$${c.cost.toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
  `;
}
