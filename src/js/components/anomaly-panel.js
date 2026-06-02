import { detectAnomalies } from '../utils/anomaly-detector.js';

export function renderAnomalyPanel(workflows, executions) {
  const anomalies = detectAnomalies(workflows, executions);
  const panel = document.getElementById('anomalyPanel');
  if (!panel) return;
  
  if (anomalies.length === 0) {
    panel.innerHTML = '<div class="anomaly-empty">✅ No anomalies detected</div>';
    return;
  }
  
  const severityIcons = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
  panel.innerHTML = anomalies.slice(0, 10).map(a => `
    <div class="anomaly-item anomaly-${a.severity}">
      <span class="anomaly-icon">${severityIcons[a.severity]}</span>
      <div class="anomaly-content">
        <strong>${a.workflow.name}</strong>
        <p>${a.message}</p>
      </div>
    </div>
  `).join('');
}
