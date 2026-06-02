export function renderHeatmap(executions) {
  const container = document.getElementById('heatmapChart');
  if (!container || executions.length === 0) return;
  
  // Build 7x24 grid (days x hours)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const grid = Array(7).fill(null).map(() => Array(24).fill(0));
  
  executions.forEach(ex => {
    const date = new Date(ex.startedAt);
    const day = date.getDay();
    const hour = date.getHours();
    grid[day][hour]++;
  });
  
  const maxVal = Math.max(...grid.flat(), 1);
  
  let html = '<div class="heatmap-grid">';
  html += '<div class="heatmap-labels">';
  days.forEach(d => { html += `<span class="heatmap-day">${d}</span>`; });
  html += '</div>';
  
  html += '<div class="heatmap-cells">';
  for (let h = 0; h < 24; h++) {
    html += `<div class="heatmap-column">`;
    for (let d = 0; d < 7; d++) {
      const val = grid[d][h];
      const intensity = val / maxVal;
      const color = intensity > 0 ? `rgba(99, 102, 241, ${0.2 + intensity * 0.8})` : 'var(--bg-tertiary)';
      html += `<div class="heatmap-cell" style="background: ${color}" title="${days[d]} ${h}:00 - ${val} executions"></div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  
  html += '<div class="heatmap-hours">';
  for (let h = 0; h < 24; h += 3) {
    html += `<span>${h}:00</span>`;
  }
  html += '</div>';
  html += '</div>';
  
  container.innerHTML = html;
}
