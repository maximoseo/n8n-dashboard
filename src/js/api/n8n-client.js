const N8N_BASE_URL = '/api/n8n';

export class N8nClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.headers = { 'X-N8N-API-KEY': apiKey, 'Accept': 'application/json' };
  }
  
  async getWorkflows(limit = 100) {
    const res = await fetch(`${N8N_BASE_URL}/workflows?limit=${limit}`, { headers: this.headers });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
  
  async getExecutions(limit = 100) {
    const res = await fetch(`${N8N_BASE_URL}/executions?limit=${limit}`, { headers: this.headers });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
  
  async activateWorkflow(id) {
    const res = await fetch(`${N8N_BASE_URL}/workflows/${id}/activate`, { method: 'POST', headers: this.headers });
    return res.ok;
  }
  
  async deactivateWorkflow(id) {
    const res = await fetch(`${N8N_BASE_URL}/workflows/${id}/deactivate`, { method: 'POST', headers: this.headers });
    return res.ok;
  }
  
  async runWorkflow(id, data = {}) {
    const res = await fetch(`${N8N_BASE_URL}/workflows/${id}/run`, { method: 'POST', headers: { ...this.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.ok;
  }
}
