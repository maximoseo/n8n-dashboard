/**
 * Google Sheets Mapping
 * Maps workflow IDs to their Google Sheets URLs
 * Source: https://docs.google.com/spreadsheets/d/1doa5ZAHeDeOwv8ruPHgWGXEpAJ1H6R53L7AjEYs_M4A/edit?gid=1785540565
 */

export const sheetsMapping = {
  // Add mappings here: "workflow_id": "https://docs.google.com/spreadsheets/d/..."
  "example-workflow-id": "https://docs.google.com/spreadsheets/d/1doa5ZAHeDeOwv8ruPHgWGXEpAJ1H6R53L7AjEYs_M4A/edit?gid=1785540565",
};

/**
 * Get Google Sheet URL for a workflow ID
 * @param {string} workflowId 
 * @returns {string|null}
 */
export function getSheetUrlFromMapping(workflowId) {
  return sheetsMapping[workflowId] || null;
}
