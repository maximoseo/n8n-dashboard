// Calculate health score for a workflow based on:
// - Success rate (40% weight)
// - Avg duration vs baseline (20%)
// - Error frequency trend (15%)
// - Last execution recency (10%)
// - Activity status (10%)
// - Tag complexity (5%)

export function calculateHealthScore(workflow, executions) {
  const wfExecutions = executions.filter(e => e.workflowId === workflow.id);
  if (wfExecutions.length === 0) {
    return { score: workflow.active ? 70 : 50, label: 'No Data', color: '#94a3b8' };
  }
  
  const successRate = wfExecutions.filter(e => e.status === 'success').length / wfExecutions.length;
  const durations = wfExecutions.filter(e => e.startedAt && e.stoppedAt).map(e => {
    return (new Date(e.stoppedAt) - new Date(e.startedAt)) / 1000;
  });
  const avgDuration = durations.length > 0 ? durations.reduce((a,b) => a+b, 0) / durations.length : 0;
  const medianDuration = durations.length > 0 ? durations.sort((a,b) => a-b)[Math.floor(durations.length/2)] : 0;
  const durationScore = medianDuration > 0 ? Math.max(0, 100 - ((avgDuration / medianDuration - 1) * 100)) : 100;
  
  const errors = wfExecutions.filter(e => e.status === 'error' || e.status === 'failed');
  const errorScore = 100 - (errors.length / wfExecutions.length * 100);
  
  const lastExec = wfExecutions[0];
  const hoursSinceLastExec = lastExec ? (Date.now() - new Date(lastExec.startedAt)) / (1000*60*60) : 999;
  const recencyScore = Math.max(0, 100 - hoursSinceLastExec * 2);
  
  const activityScore = workflow.active ? 100 : 30;
  const tagScore = (workflow.tags || []).length > 0 ? 100 : 70;
  
  const score = Math.round(
    successRate * 40 +
    durationScore * 0.20 +
    errorScore * 0.15 +
    recencyScore * 0.10 +
    activityScore * 0.10 +
    tagScore * 0.05
  );
  
  let label, color;
  if (score >= 80) { label = 'Healthy'; color = '#10b981'; }
  else if (score >= 60) { label = 'Needs Attention'; color = '#f59e0b'; }
  else if (score >= 40) { label = 'Degraded'; color = '#f97316'; }
  else { label = 'Critical'; color = '#ef4444'; }
  
  return { score: Math.min(100, Math.max(0, score)), label, color };
}

export function getHealthColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}
