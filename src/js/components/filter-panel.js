import { filterSystem } from '../utils/advanced-filters.js';

/**
 * Initialize advanced filter panel
 */
export function initFilterPanel() {
  const panel = document.getElementById('advancedFilterPanel');
  if (!panel) return;

  // Get all unique tags
  const tags = getAllTags();
  populateTagFilter(tags);

  // Setup event listeners
  setupFilterListeners();
  setupSortListeners();
  setupClearButton();
}

/**
 * Get all unique tags from workflows
 */
function getAllTags() {
  const workflows = window.workflowsData?.data || [];
  const tagSet = new Set();
  
  workflows.forEach(wf => {
    wf.tags?.forEach(tag => tagSet.add(tag.name));
  });

  return Array.from(tagSet).sort();
}

/**
 * Populate tag filter dropdown
 */
function populateTagFilter(tags) {
  const tagSelect = document.getElementById('filter-tags');
  if (!tagSelect) return;

  tagSelect.innerHTML = tags.map(tag => 
    `<option value="${tag}">${tag}</option>`
  ).join('');
}

/**
 * Setup filter event listeners
 */
function setupFilterListeners() {
  const filters = [
    'status', 'health', 'last-exec', 'success', 'exec-count'
  ];

  filters.forEach(filterName => {
    const element = document.getElementById(`filter-${filterName}`);
    if (element) {
      element.addEventListener('change', (e) => {
        const key = filterName.replace('-', '');
        filterSystem.setFilter(key, e.target.value);
        triggerFilterUpdate();
      });
    }
  });

  // Tags filter (multi-select)
  const tagSelect = document.getElementById('filter-tags');
  if (tagSelect) {
    tagSelect.addEventListener('change', (e) => {
      const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
      filterSystem.setFilter('tags', selected);
      triggerFilterUpdate();
    });
  }
}

/**
 * Setup sort event listeners
 */
function setupSortListeners() {
  const sortField = document.getElementById('sort-field');
  const sortDirection = document.getElementById('sort-direction');

  if (sortField) {
    sortField.addEventListener('change', (e) => {
      const direction = sortDirection?.value || 'asc';
      filterSystem.setSort(e.target.value, direction);
      triggerFilterUpdate();
    });
  }

  if (sortDirection) {
    sortDirection.addEventListener('change', (e) => {
      const field = sortField?.value || 'name';
      filterSystem.setSort(field, e.target.value);
      triggerFilterUpdate();
    });
  }
}

/**
 * Setup clear filters button
 */
function setupClearButton() {
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filterSystem.clearFilters();
      resetFilterUI();
      triggerFilterUpdate();
    });
  }
}

/**
 * Reset filter UI to default values
 */
function resetFilterUI() {
  const selects = [
    'filter-status', 'filter-health', 'filter-last-exec',
    'filter-success', 'filter-exec-count'
  ];

  selects.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.value = 'all';
  });

  const tagSelect = document.getElementById('filter-tags');
  if (tagSelect) {
    Array.from(tagSelect.options).forEach(opt => opt.selected = false);
  }

  const sortField = document.getElementById('sort-field');
  if (sortField) sortField.value = 'name';

  const sortDirection = document.getElementById('sort-direction');
  if (sortDirection) sortDirection.value = 'asc';
}

/**
 * Trigger filter update event
 */
function triggerFilterUpdate() {
  window.dispatchEvent(new CustomEvent('filtersUpdated'));
}
