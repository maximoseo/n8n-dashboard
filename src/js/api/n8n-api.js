// N8N API Configuration
const N8N_BASE_URL = 'https://websiseo.app.n8n.cloud/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZTg3MjgzZS03YmQyLTRkZTctYjI3ZC03ZTMyZDc5YTU2MmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQxMjcwMjI5fQ.yB8cFIR-r5OIkzGFKqZvWJqY8RfGiXOGUjkYiFyk';

/**
 * Fetch workflows from n8n API
 */
export async function fetchWorkflows() {
  try {
    const response = await fetch(`${N8N_BASE_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return [];
  }
}

/**
 * Fetch executions from n8n API
 */
export async function fetchExecutions(limit = 100) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/executions?limit=${limit}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    return [];
  }
}

/**
 * Activate a workflow
 */
export async function activateWorkflow(workflowId) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to activate workflow:', error);
    return false;
  }
}

/**
 * Deactivate a workflow
 */
export async function deactivateWorkflow(workflowId) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}/deactivate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to deactivate workflow:', error);
    return false;
  }
}

/**
 * Run a workflow manually
 */
export async function runWorkflow(workflowId) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/workflows/${workflowId}/run`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({})
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to run workflow:', error);
    return false;
  }
}
