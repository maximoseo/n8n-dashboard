/**
 * Workflow Links Utilities
 * Handles n8n workflow URLs and Google Sheet links
 */

const N8N_BASE_URL = 'https://websiseo.app.n8n.cloud';

/**
 * Generate n8n workflow URL
 * @param {string} workflowId - Workflow ID
 * @returns {string} n8n workflow URL
 */
export function getN8nWorkflowUrl(workflowId) {
  return `${N8N_BASE_URL}/workflow/${workflowId}`;
}

/**
 * Extract Google Sheet URL from workflow tags or notes
 * @param {Object} workflow - Workflow object
 * @returns {string|null} Google Sheet URL or null
 */
export function getGoogleSheetUrl(workflow) {
  // Option 1: Check tags for Google Sheet URL
  if (workflow.tags && Array.isArray(workflow.tags)) {
    const sheetTag = workflow.tags.find(tag => 
      tag.name && tag.name.includes('docs.google.com/spreadsheets')
    );
    if (sheetTag) {
      return sheetTag.name;
    }
  }

  // Option 2: Check workflow notes for Google Sheet URL
  if (workflow.notes) {
    const sheetMatch = workflow.notes.match(/https:\/\/docs\.google\.com\/spreadsheets\/[^\s<>"']+/);
    if (sheetMatch) {
      return sheetMatch[0];
    }
  }

  // Option 3: Check workflow name for sheet ID pattern
  const nameMatch = workflow.name?.match(/\[sheet:([a-zA-Z0-9-_]+)\]/);
  if (nameMatch) {
    return `https://docs.google.com/spreadsheets/d/${nameMatch[1]}`;
  }

  return null;
}

/**
 * Check if workflow has Google Sheet linked
 * @param {Object} workflow - Workflow object
 * @returns {boolean}
 */
export function hasGoogleSheet(workflow) {
  return getGoogleSheetUrl(workflow) !== null;
}

/**
 * Open URL in new tab
 * @param {string} url - URL to open
 */
export function openInNewTab(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
