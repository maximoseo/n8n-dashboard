export function generateReportHTML(stats, workflows, executions) {
  const successRate = stats.recentExecutions > 0 ? Math.round(stats.successfulExecutions / stats.recentExecutions * 100) : 0;
  
  return `
    <h1>n8n Dashboard Weekly Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    <h2>Summary</h2>
    <ul>
      <li>Total Workflows: ${stats.totalWorkflows}</li>
      <li>Active: ${stats.activeWorkflows}</li>
      <li>Inactive: ${stats.inactiveWorkflows}</li>
      <li>Recent Executions: ${stats.recentExecutions}</li>
      <li>Success Rate: ${successRate}%</li>
    </ul>
    
    <h2>Top 5 Active Workflows</h2>
    <ol>
      ${workflows.filter(w => w.active).slice(0, 5).map(w => `<li>${w.name}</li>`).join('')}
    </ol>
  `;
}
