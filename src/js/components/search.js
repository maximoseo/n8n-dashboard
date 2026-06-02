import { renderWorkflows } from './workflow-card.js';

let currentFilter = 'all';

/**
 * Initialize search and filter functionality
 * Sets up event listeners for search input and filter tabs
 */
export function initSearch() {
  const searchInput = document.getElementById('searchInput');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      renderWorkflows(query, currentFilter);
    });
  }

  // Filter Tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
      renderWorkflows(searchValue, currentFilter);
    });
  });
}
