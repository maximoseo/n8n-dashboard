import { CHART_CONFIG } from '../utils/constants.js';
import { formatExecutionTime } from '../utils/helpers.js';

/**
 * Render donut chart showing execution success/failure rates
 * @param {number} success - Number of successful executions
 * @param {number} failed - Number of failed executions
 * @param {number} total - Total number of executions
 */
export function renderDonutChart(success, failed, total) {
  const svg = document.getElementById('donutChart');
  const legend = document.getElementById('donutLegend');
  
  if (!svg || !legend) return;

  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
  const other = total - success - failed;

  const successRateElement = document.getElementById('successRate');
  if (successRateElement) {
    successRateElement.textContent = successRate + '%';
  }

  // Calculate arc lengths
  const { donutRadius: radius } = CHART_CONFIG;
  const circumference = 2 * Math.PI * radius;
  const successArc = (success / total) * circumference;
  const failedArc = (failed / total) * circumference;
  const otherArc = (other / total) * circumference;

  // Clear existing circles
  while (svg.children.length > 1) {
    svg.removeChild(svg.lastChild);
  }

  // Add success arc
  const successCircle = createArc('var(--success)', successArc, circumference, 0);
  svg.appendChild(successCircle);

  // Add failed arc
  if (failed > 0) {
    const failedCircle = createArc('var(--error)', failedArc, circumference, -successArc);
    svg.appendChild(failedCircle);
  }

  // Add other arc
  if (other > 0) {
    const otherCircle = createArc('var(--bg-tertiary)', otherArc, circumference, -(successArc + failedArc));
    svg.appendChild(otherCircle);
  }

  // Update legend
  legend.innerHTML = `
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--success);"></div>
      <div class="legend-label">Success</div>
      <div class="legend-value">${success}</div>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--error);"></div>
      <div class="legend-label">Failed</div>
      <div class="legend-value">${failed}</div>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--bg-tertiary);"></div>
      <div class="legend-label">Other</div>
      <div class="legend-value">${other}</div>
    </div>
  `;
}

/**
 * Create an SVG arc element
 * @param {string} stroke - Stroke color
 * @param {number} arcLength - Arc length
 * @param {number} circumference - Total circumference
 * @param {number} offset - Dash offset
 * @returns {SVGCircleElement} SVG circle element
 */
function createArc(stroke, arcLength, circumference, offset) {
  const { donutCenterX: cx, donutCenterY: cy, donutRadius: r, donutStrokeWidth: strokeWidth } = CHART_CONFIG;
  
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', cx.toString());
  circle.setAttribute('cy', cy.toString());
  circle.setAttribute('r', r.toString());
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', stroke);
  circle.setAttribute('stroke-width', strokeWidth.toString());
  circle.setAttribute('stroke-dasharray', `${arcLength} ${circumference - arcLength}`);
  circle.setAttribute('stroke-dashoffset', offset.toString());
  circle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
  
  return circle;
}

/**
 * Render timeline chart showing recent executions
 * @param {Array} executions - Array of execution objects
 */
export function renderTimeline(executions) {
  const container = document.getElementById('timelineChart');
  if (!container) return;

  container.innerHTML = '';

  const { timelineMaxBars, timelineMaxHeight: maxHeight } = CHART_CONFIG;
  const last30 = executions.slice(0, timelineMaxBars).reverse();

  last30.forEach(ex => {
    const bar = document.createElement('div');
    bar.className = 'timeline-bar';
    
    if (ex.status === 'success') {
      bar.classList.add('success');
    } else if (ex.status === 'error' || ex.status === 'failed') {
      bar.classList.add('error');
    }

    const height = Math.max(20, Math.random() * maxHeight * 0.7 + maxHeight * 0.3);
    bar.style.height = height + 'px';
    
    const workflowId = ex.workflowId || 'Unknown';
    const time = ex.stoppedAt || ex.startedAt || '';
    bar.setAttribute('data-tooltip', `${workflowId} - ${ex.status} - ${formatExecutionTime(time)}`);
    
    container.appendChild(bar);
  });
}
