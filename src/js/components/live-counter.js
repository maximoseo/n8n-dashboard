export function renderLiveCounter(executions) {
  const now = Date.now();
  const last5min = executions.filter(e => (now - new Date(e.startedAt)) < 300000);
  const running = last5min.filter(e => !e.stoppedAt || (now - new Date(e.stoppedAt)) < 10000);
  
  const counter = document.getElementById('liveCounter');
  if (!counter) return;
  
  counter.innerHTML = `
    <span class="live-dot ${running.length > 0 ? 'active' : ''}"></span>
    <span>${running.length} running now</span>
    <span class="live-separator">|</span>
    <span>${last5min.length} in last 5 min</span>
  `;
}
