export function renderTrendChart(executions) {
  const container = document.getElementById('trendChart');
  if (!container || executions.length === 0) return;
  
  // Group by date
  const byDate = {};
  executions.forEach(ex => {
    const date = new Date(ex.startedAt).toISOString().split('T')[0];
    if (!byDate[date]) byDate[date] = { total: 0, success: 0, failed: 0 };
    byDate[date].total++;
    if (ex.status === 'success') byDate[date].success++;
    if (ex.status === 'error' || ex.status === 'failed') byDate[date].failed++;
  });
  
  const dates = Object.keys(byDate).sort();
  const successRates = dates.map(d => Math.round(byDate[d].success / byDate[d].total * 100));
  
  // Simple SVG line chart
  const width = 400;
  const height = 120;
  const padding = 20;
  const maxRate = 100;
  
  const points = successRates.map((rate, i) => {
    const x = padding + (i / (successRates.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (rate / maxRate) * (height - 2 * padding);
    return `${x},${y}`;
  });
  
  const pathData = points.length > 1 ? `M ${points.join(' L ')}` : '';
  
  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="trend-svg">
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--success)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--success)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${pathData ? `
        <path d="${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z" fill="url(#trendGradient)"/>
        <path d="${pathData}" fill="none" stroke="var(--success)" stroke-width="2"/>
      ` : ''}
      ${successRates.map((rate, i) => {
        const x = padding + (i / (successRates.length - 1 || 1)) * (width - 2 * padding);
        const y = height - padding - (rate / maxRate) * (height - 2 * padding);
        return `<circle cx="${x}" cy="${y}" r="3" fill="var(--success)"/>`;
      }).join('')}
    </svg>
    <div class="trend-stats">
      <span class="trend-label">${dates.length} days tracked</span>
      <span class="trend-value">${successRates.length > 0 ? Math.round(successRates.reduce((a,b) => a+b, 0) / successRates.length) : 0}% avg success</span>
    </div>
  `;
}
