export function calculateSLA(executions, target = 99.0) {
  const total = executions.length;
  const successful = executions.filter(e => e.status === 'success').length;
  const currentRate = total > 0 ? (successful / total * 100) : 0;
  const isMet = currentRate >= target;
  
  // MTTR (Mean Time To Recovery) - avg time between failure and next success
  let recoveryTimes = [];
  const sorted = [...executions].sort((a,b) => new Date(a.startedAt) - new Date(b.startedAt));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].status === 'error' || sorted[i].status === 'failed') {
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[j].status === 'success' && sorted[j].workflowId === sorted[i].workflowId) {
          const recoveryTime = (new Date(sorted[j].startedAt) - new Date(sorted[i].startedAt)) / 60000;
          recoveryTimes.push(recoveryTime);
          break;
        }
      }
    }
  }
  const mttr = recoveryTimes.length > 0 ? Math.round(recoveryTimes.reduce((a,b) => a+b, 0) / recoveryTimes.length) : 0;
  
  return {
    currentRate: Math.round(currentRate * 10) / 10,
    target,
    isMet,
    mttr,
    total,
    successful
  };
}

export function renderSLACard(executions) {
  const sla = calculateSLA(executions);
  const container = document.getElementById('slaCard');
  if (!container) return;
  
  container.innerHTML = `
    <div class="sla-indicator ${sla.isMet ? 'sla-met' : 'sla-missed'}">
      <div class="sla-icon">${sla.isMet ? '✅' : '❌'}</div>
      <div class="sla-rate">${sla.currentRate}%</div>
      <div class="sla-label">SLA ${sla.isMet ? 'Met' : 'Missed'}</div>
      <div class="sla-target">Target: ${sla.target}%</div>
      <div class="sla-mttr">MTTR: ${sla.mttr} min</div>
    </div>
  `;
}
