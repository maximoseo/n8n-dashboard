/**
 * Advanced Filter System
 * Provides comprehensive filtering and sorting capabilities
 */

export class AdvancedFilterSystem {
  constructor() {
    this.filters = {
      status: 'all',
      healthScore: 'all',
      tags: [],
      lastExecution: 'all',
      successRate: 'all',
      executionCount: 'all',
      search: ''
    };
    this.sort = {
      field: 'name',
      direction: 'asc'
    };
  }

  /**
   * Apply all filters to workflows
   */
  applyFilters(workflows, executions) {
    let filtered = [...workflows];

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(wf => 
        this.filters.status === 'active' ? wf.active : !wf.active
      );
    }

    // Health score filter
    if (this.filters.healthScore !== 'all') {
      filtered = filtered.filter(wf => {
        const score = this.calculateHealthScore(wf, executions);
        return this.matchHealthScore(score, this.filters.healthScore);
      });
    }

    // Tags filter
    if (this.filters.tags.length > 0) {
      filtered = filtered.filter(wf => 
        this.filters.tags.some(tag => 
          wf.tags?.some(t => t.name === tag)
        )
      );
    }

    // Last execution filter
    if (this.filters.lastExecution !== 'all') {
      filtered = filtered.filter(wf => {
        const lastExec = this.getLastExecution(wf.id, executions);
        return this.matchLastExecution(lastExec, this.filters.lastExecution);
      });
    }

    // Success rate filter
    if (this.filters.successRate !== 'all') {
      filtered = filtered.filter(wf => {
        const stats = this.getWorkflowStats(wf.id, executions);
        const rate = stats.total > 0 ? (stats.success / stats.total * 100) : 0;
        return this.matchSuccessRate(rate, this.filters.successRate);
      });
    }

    // Execution count filter
    if (this.filters.executionCount !== 'all') {
      filtered = filtered.filter(wf => {
        const stats = this.getWorkflowStats(wf.id, executions);
        return this.matchExecutionCount(stats.total, this.filters.executionCount);
      });
    }

    // Search filter
    if (this.filters.search) {
      const query = this.filters.search.toLowerCase();
      filtered = filtered.filter(wf => 
        wf.name.toLowerCase().includes(query) ||
        wf.id.toLowerCase().includes(query) ||
        wf.tags?.some(t => t.name.toLowerCase().includes(query))
      );
    }

    return this.applySort(filtered, executions);
  }

  /**
   * Apply sorting to filtered workflows
   */
  applySort(workflows, executions) {
    return workflows.sort((a, b) => {
      let comparison = 0;

      switch (this.sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'healthScore':
          const scoreA = this.calculateHealthScore(a, executions);
          const scoreB = this.calculateHealthScore(b, executions);
          comparison = scoreA - scoreB;
          break;
        case 'lastExecution':
          const lastA = this.getLastExecution(a.id, executions);
          const lastB = this.getLastExecution(b.id, executions);
          comparison = new Date(lastA || 0) - new Date(lastB || 0);
          break;
        case 'successRate':
          const statsA = this.getWorkflowStats(a.id, executions);
          const statsB = this.getWorkflowStats(b.id, executions);
          const rateA = statsA.total > 0 ? (statsA.success / statsA.total * 100) : 0;
          const rateB = statsB.total > 0 ? (statsB.success / statsB.total * 100) : 0;
          comparison = rateA - rateB;
          break;
        case 'executionCount':
          const countA = this.getWorkflowStats(a.id, executions).total;
          const countB = this.getWorkflowStats(b.id, executions).total;
          comparison = countA - countB;
          break;
        case 'createdDate':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
      }

      return this.sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Calculate health score for a workflow
   */
  calculateHealthScore(workflow, executions) {
    const stats = this.getWorkflowStats(workflow.id, executions);
    if (stats.total === 0) return workflow.active ? 70 : 50;

    const successRate = (stats.success / stats.total) * 100;
    const lastExec = this.getLastExecution(workflow.id, executions);
    const daysSinceLastExec = lastExec 
      ? (Date.now() - new Date(lastExec).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    let score = successRate * 0.6;
    
    if (workflow.active) score += 20;
    if (daysSinceLastExec < 1) score += 15;
    else if (daysSinceLastExec < 7) score += 10;
    else if (daysSinceLastExec < 30) score += 5;

    if (stats.total > 10) score += 5;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Get last execution timestamp for a workflow
   */
  getLastExecution(workflowId, executions) {
    const wfExecs = executions
      .filter(e => e.workflowId === workflowId)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    return wfExecs[0]?.startedAt || null;
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(workflowId, executions) {
    const wfExecs = executions.filter(e => e.workflowId === workflowId);
    return {
      total: wfExecs.length,
      success: wfExecs.filter(e => e.status === 'success').length,
      failed: wfExecs.filter(e => e.status === 'error' || e.status === 'failed').length
    };
  }

  /**
   * Match health score to filter
   */
  matchHealthScore(score, filter) {
    switch (filter) {
      case 'healthy': return score >= 80;
      case 'warning': return score >= 60 && score < 80;
      case 'degraded': return score >= 40 && score < 60;
      case 'critical': return score < 40;
      default: return true;
    }
  }

  /**
   * Match last execution to filter
   */
  matchLastExecution(lastExec, filter) {
    if (!lastExec) return filter === 'not-7days' || filter === 'not-30days';

    const daysSince = (Date.now() - new Date(lastExec).getTime()) / (1000 * 60 * 60 * 24);
    
    switch (filter) {
      case 'today': return daysSince < 1;
      case 'week': return daysSince < 7;
      case 'not-7days': return daysSince >= 7;
      case 'not-30days': return daysSince >= 30;
      default: return true;
    }
  }

  /**
   * Match success rate to filter
   */
  matchSuccessRate(rate, filter) {
    switch (filter) {
      case '100': return rate === 100;
      case '90-99': return rate >= 90 && rate < 100;
      case 'low': return rate < 90;
      default: return true;
    }
  }

  /**
   * Match execution count to filter
   */
  matchExecutionCount(count, filter) {
    switch (filter) {
      case 'high': return count > 50;
      case 'low': return count > 0 && count < 10;
      case 'zero': return count === 0;
      default: return true;
    }
  }

  /**
   * Update filter value
   */
  setFilter(key, value) {
    if (this.filters.hasOwnProperty(key)) {
      this.filters[key] = value;
    }
  }

  /**
   * Update sort configuration
   */
  setSort(field, direction = 'asc') {
    this.sort.field = field;
    this.sort.direction = direction;
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters = {
      status: 'all',
      healthScore: 'all',
      tags: [],
      lastExecution: 'all',
      successRate: 'all',
      executionCount: 'all',
      search: ''
    };
  }
}

export const filterSystem = new AdvancedFilterSystem();
