export function parseQuery(query, workflows, executions) {
  const q = query.toLowerCase().trim();
  
  // Failed workflows
  if (q.includes('failed') || q.includes('נכשל') || q.includes('שגיאה')) {
    const failed = executions.filter(e => e.status === 'error' || e.status === 'failed');
    const wfIds = [...new Set(failed.map(e => e.workflowId))];
    return { type: 'filter', workflows: workflows.filter(w => wfIds.includes(w.id)), message: `Found ${wfIds.length} workflows with failures` };
  }
  
  // Active workflows
  if (q.includes('active') || q.includes('פעיל') || q.includes('רץ')) {
    return { type: 'filter', workflows: workflows.filter(w => w.active), message: `${workflows.filter(w => w.active).length} active workflows` };
  }
  
  // Inactive
  if (q.includes('inactive') || q.includes('לא פעיל') || q.includes('עצר')) {
    return { type: 'filter', workflows: workflows.filter(w => !w.active), message: `${workflows.filter(w => !w.active).length} inactive workflows` };
  }
  
  // Slow
  if (q.includes('slow') || q.includes('איטי') || q.includes('לאט')) {
    const slowWfs = [];
    workflows.forEach(wf => {
      const wfExecs = executions.filter(e => e.workflowId === wf.id && e.startedAt && e.stoppedAt);
      if (wfExecs.length > 0) {
        const avgDur = wfExecs.reduce((sum, e) => sum + (new Date(e.stoppedAt) - new Date(e.startedAt))/1000, 0) / wfExecs.length;
        if (avgDur > 60) slowWfs.push({ ...wf, avgDuration: avgDur });
      }
    });
    slowWfs.sort((a,b) => b.avgDuration - a.avgDuration);
    return { type: 'filter', workflows: slowWfs, message: `${slowWfs.length} slow workflows (>1 min avg)` };
  }
  
  // Search by name
  const nameMatch = workflows.filter(w => w.name.toLowerCase().includes(q));
  if (nameMatch.length > 0) {
    return { type: 'filter', workflows: nameMatch, message: `Found ${nameMatch.length} workflows matching "${query}"` };
  }
  
  return { type: 'none', workflows: workflows, message: `No specific filter matched. Showing all ${workflows.length} workflows.` };
}
