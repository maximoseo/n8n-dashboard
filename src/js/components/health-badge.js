import { calculateHealthScore } from '../utils/health-score.js';

export function renderHealthBadge(workflow, executions) {
  const health = calculateHealthScore(workflow, executions);
  return `<span class="health-badge" style="background: ${health.color}20; color: ${health.color}; border: 1px solid ${health.color}40;" title="Health Score: ${health.score}/100 - ${health.label}">${health.score} ${health.label}</span>`;
}
