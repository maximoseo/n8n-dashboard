// N8N API Configuration - use proxy to avoid CORS
const N8N_BASE_URL = '/api/n8n';
const N8N_API_KEY = ''; // Key handled server-side via proxy

const headers = {
  'X-N8N-API-KEY': N8N_API_KEY,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

async function apiGet(endpoint) {
  const res = await fetch(`${N8N_BASE_URL}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function apiPost(endpoint, body = {}) {
  const res = await fetch(`${N8N_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function apiPut(endpoint, body = {}) {
  const res = await fetch(`${N8N_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function apiDelete(endpoint) {
  const res = await fetch(`${N8N_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ============ WORKFLOWS ============

export async function fetchWorkflows() {
  try {
    const data = await apiGet('/workflows');
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return [];
  }
}

export async function getWorkflow(workflowId) {
  try {
    return await apiGet(`/workflows/${workflowId}`);
  } catch (error) {
    console.error('Failed to get workflow:', error);
    return null;
  }
}

export async function updateWorkflow(workflowId, workflowData) {
  try {
    return await apiPut(`/workflows/${workflowId}`, workflowData);
  } catch (error) {
    console.error('Failed to update workflow:', error);
    throw error;
  }
}

export async function activateWorkflow(workflowId) {
  try {
    return await apiPost(`/workflows/${workflowId}/activate`);
  } catch (error) {
    console.error('Failed to activate workflow:', error);
    return false;
  }
}

export async function deactivateWorkflow(workflowId) {
  try {
    return await apiPost(`/workflows/${workflowId}/deactivate`);
  } catch (error) {
    console.error('Failed to deactivate workflow:', error);
    return false;
  }
}

export async function runWorkflow(workflowId, data = {}) {
  try {
    return await apiPost(`/workflows/${workflowId}/run`, data);
  } catch (error) {
    console.error('Failed to run workflow:', error);
    return false;
  }
}

// ============ EXECUTIONS ============

export async function fetchExecutions(limit = 100) {
  try {
    const data = await apiGet(`/executions?limit=${limit}`);
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    return [];
  }
}

export async function getExecution(executionId) {
  try {
    return await apiGet(`/executions/${executionId}`);
  } catch (error) {
    console.error('Failed to get execution:', error);
    return null;
  }
}

// ============ NODE OPERATIONS ============

/**
 * Get all nodes from a workflow
 */
export async function getWorkflowNodes(workflowId) {
  const workflow = await getWorkflow(workflowId);
  if (!workflow || !workflow.nodes) return [];
  return workflow.nodes;
}

/**
 * Update a specific node in a workflow
 */
export async function updateWorkflowNode(workflowId, nodeId, nodeData) {
  const workflow = await getWorkflow(workflowId);
  if (!workflow || !workflow.nodes) throw new Error('Workflow not found');

  const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
  if (nodeIndex === -1) throw new Error('Node not found');

  // Merge node data
  workflow.nodes[nodeIndex] = {
    ...workflow.nodes[nodeIndex],
    ...nodeData,
    parameters: {
      ...workflow.nodes[nodeIndex].parameters,
      ...(nodeData.parameters || {})
    }
  };

  return await updateWorkflow(workflowId, workflow);
}

/**
 * Update trigger/cron schedule for a workflow
 */
export async function updateTrigger(workflowId, cronExpression) {
  const workflow = await getWorkflow(workflowId);
  if (!workflow || !workflow.nodes) throw new Error('Workflow not found');

  // Find trigger nodes
  const triggerNode = workflow.nodes.find(n =>
    n.type.includes('trigger') || n.type.includes('cron') || n.type.includes('schedule')
  );

  if (!triggerNode) throw new Error('No trigger node found');

  // Update cron expression
  triggerNode.parameters = {
    ...triggerNode.parameters,
    rule: { interval: [{ field: 'cronExpression', expression: cronExpression }] }
  };

  return await updateWorkflow(workflowId, workflow);
}

/**
 * Update URL in HTTP Request nodes
 */
export async function updateNodeUrl(workflowId, nodeId, newUrl) {
  return await updateWorkflowNode(workflowId, nodeId, {
    parameters: { url: newUrl }
  });
}

/**
 * Update Google Sheets connection
 */
export async function updateGoogleSheets(workflowId, nodeId, { spreadsheetId, sheetName, range }) {
  const workflow = await getWorkflow(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  const node = workflow.nodes.find(n => n.id === nodeId);
  if (!node) throw new Error('Node not found');

  const params = { ...node.parameters };
  if (spreadsheetId) params.documentId = { value: spreadsheetId, mode: 'id' };
  if (sheetName) params.sheetName = { value: sheetName };
  if (range) params.range = range;

  return await updateWorkflowNode(workflowId, nodeId, { parameters: params });
}

/**
 * Get workflow tags
 */
export async function getWorkflowTags() {
  try {
    return await apiGet('/tags');
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return [];
  }
}

/**
 * Get credentials list (for connection management)
 */
export async function getCredentials() {
  try {
    const data = await apiGet('/credentials');
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
    return [];
  }
}

/**
 * Test workflow connection/credentials
 */
export async function testNodeConnection(workflowId, nodeId) {
  try {
    const result = await runWorkflow(workflowId, {
      workflowData: { startNodes: [{ name: nodeId }] }
    });
    return result;
  } catch (error) {
    console.error('Failed to test connection:', error);
    return null;
  }
}
