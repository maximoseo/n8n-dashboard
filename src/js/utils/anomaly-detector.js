export function detectAnomalies(workflows, executions) {
  const anomalies = [];
  
  workflows.forEach(wf => {
    const wfExecs = executions.filter(e => e.workflowId === wf.id);
    if (wfExecs.length < 3) return;
    
    // Spike detection - sudden increase in executions
    const now = Date.now();
    const last24h = wfExecs.filter(e => (now - new Date(e.startedAt)) < 86400000);
    const prev24h = wfExecs.filter(e => {
      const age = (now - new Date(e.startedAt));
      return age >= 86400000 && age < 172800000;
    });
    if (prev24h.length > 0 && last24h.length > prev24h.length * 3) {
      anomalies.push({ type: 'spike', workflow: wf, message: `Execution spike: ${last24h.length} runs in 24h (was ${prev24h.length})`, severity: 'warning' });
    }
    
    // Failure clustering
    const recentFails = wfExecs.filter(e => (e.status === 'error' || e.status === 'failed') && (now - new Date(e.startedAt)) < 3600000);
    if (recentFails.length >= 3) {
      anomalies.push({ type: 'failure_cluster', workflow: wf, message: `${recentFails.length} failures in the last hour`, severity: 'critical' });
    }
    
    // Duration drift
    const durations = wfExecs.filter(e => e.startedAt && e.stoppedAt).map(e => (new Date(e.stoppedAt) - new Date(e.startedAt)) / 1000);
    if (durations.length >= 5) {
      const recent = durations.slice(0, 3);
      const older = durations.slice(3);
      const recentAvg = recent.reduce((a,b) => a+b, 0) / recent.length;
      const olderAvg = older.reduce((a,b) => a+b, 0) / older.length;
      if (olderAvg > 0 && recentAvg > olderAvg * 2) {
        anomalies.push({ type: 'duration_drift', workflow: wf, message: `Duration increased ${Math.round(recentAvg/olderAvg*100)}% (${Math.round(recentAvg)}s vs ${Math.round(olderAvg)}s avg)`, severity: 'warning' });
      }
    }
    
    // Stale workflow - active but no recent executions
    if (wf.active) {
      const lastExec = wfExecs[0];
      if (lastExec) {
        const daysSince = (now - new Date(lastExec.startedAt)) / 86400000;
        if (daysSince > 7) {
          anomalies.push({ type: 'stale', workflow: wf, message: `Active but no executions for ${Math.round(daysSince)} days`, severity: 'info' });
        }
      }
    }
  });
  
  return anomalies.sort((a,b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}
