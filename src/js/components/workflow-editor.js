/**
 * Workflow Editor Component - Full control over n8n workflow nodes
 */

import { 
  getWorkflow, 
  updateWorkflow, 
  updateWorkflowNode,
  updateTrigger,
  updateNodeUrl,
  updateGoogleSheets,
  getCredentials
} from '../api/n8n-api.js';

export class WorkflowEditor {
  constructor(container) {
    this.container = container;
    this.workflow = null;
    this.workflowId = null;
    this.credentials = [];
    this.originalNodes = [];
    this.modifiedNodes = [];
  }

  async load(workflowId) {
    this.workflowId = workflowId;
    this.workflow = await getWorkflow(workflowId);
    this.credentials = await getCredentials();
    
    if (!this.workflow) {
      this.renderError('Workflow not found');
      return;
    }

    this.originalNodes = JSON.parse(JSON.stringify(this.workflow.nodes));
    this.modifiedNodes = JSON.parse(JSON.stringify(this.workflow.nodes));
    this.render();
  }

  render() {
    const html = `
      <div class="workflow-editor">
        <div class="editor-header">
          <h2>🔧 ${this.workflow.name}</h2>
          <div class="editor-actions">
            <button class="btn btn-secondary" onclick="this.close()">✖️ סגור</button>
            <button class="btn btn-primary" onclick="this.save()">💾 שמור שינויים</button>
          </div>
        </div>

        <div class="editor-tabs">
          <button class="tab-btn active" data-tab="nodes">📦 Nodes</button>
          <button class="tab-btn" data-tab="triggers">⏰ Triggers</button>
          <button class="tab-btn" data-tab="connections">🔗 Connections</button>
          <button class="tab-btn" data-tab="json">📄 JSON</button>
        </div>

        <div class="tab-content">
          <div id="nodes-tab" class="tab-pane active">
            ${this.renderNodesTab()}
          </div>
          <div id="triggers-tab" class="tab-pane">
            ${this.renderTriggersTab()}
          </div>
          <div id="connections-tab" class="tab-pane">
            ${this.renderConnectionsTab()}
          </div>
          <div id="json-tab" class="tab-pane">
            ${this.renderJsonTab()}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  renderNodesTab() {
    return `
      <div class="nodes-list">
        <h3>Workflow Nodes (${this.modifiedNodes.length})</h3>
        ${this.modifiedNodes.map((node, index) => this.renderNodeCard(node, index)).join('')}
      </div>
    `;
  }

  renderNodeCard(node, index) {
    const nodeType = this.getNodeTypeIcon(node.type);
    const isModified = this.isNodeModified(node.id);
    
    return `
      <div class="node-card ${isModified ? 'modified' : ''}" data-node-id="${node.id}" data-node-index="${index}">
        <div class="node-header">
          <span class="node-icon">${nodeType}</span>
          <h4>${node.name}</h4>
          <span class="node-type">${node.type}</span>
          ${isModified ? '<span class="modified-badge">Modified</span>' : ''}
        </div>
        
        <div class="node-parameters">
          ${this.renderNodeParameters(node, index)}
        </div>
      </div>
    `;
  }

  renderNodeParameters(node, index) {
    const params = node.parameters || {};
    let html = '';

    // URL parameter (HTTP Request nodes)
    if (params.url !== undefined) {
      html += `
        <div class="param-group">
          <label>🌐 URL</label>
          <input type="text" 
                 class="param-input" 
                 data-node-index="${index}" 
                 data-param="url"
                 value="${params.url || ''}"
                 placeholder="https://...">
        </div>
      `;
    }

    // Method parameter
    if (params.method !== undefined) {
      html += `
        <div class="param-group">
          <label>📡 Method</label>
          <select class="param-select" data-node-index="${index}" data-param="method">
            <option value="GET" ${params.method === 'GET' ? 'selected' : ''}>GET</option>
            <option value="POST" ${params.method === 'POST' ? 'selected' : ''}>POST</option>
            <option value="PUT" ${params.method === 'PUT' ? 'selected' : ''}>PUT</option>
            <option value="DELETE" ${params.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
            <option value="PATCH" ${params.method === 'PATCH' ? 'selected' : ''}>PATCH</option>
          </select>
        </div>
      `;
    }

    // Google Sheets parameters
    if (node.type.includes('googleSheets')) {
      html += this.renderGoogleSheetsParams(params, index);
    }

    // Email parameters
    if (node.type.includes('email') || node.type.includes('gmail')) {
      html += this.renderEmailParams(params, index);
    }

    // AI/LLM parameters (tone, prompt)
    if (params.prompt !== undefined || params.systemMessage !== undefined) {
      html += this.renderAIParams(params, index);
    }

    // Generic text parameters
    Object.keys(params).forEach(key => {
      if (!['url', 'method', 'prompt', 'systemMessage'].includes(key) && 
          typeof params[key] === 'string' && 
          params[key].length < 500) {
        html += `
          <div class="param-group">
            <label>${key}</label>
            <input type="text" 
                   class="param-input" 
                   data-node-index="${index}" 
                   data-param="${key}"
                   value="${params[key] || ''}">
          </div>
        `;
      }
    });

    return html || '<p class="no-params">No editable parameters</p>';
  }

  renderGoogleSheetsParams(params, index) {
    const docId = params.documentId?.value || '';
    const sheetName = params.sheetName?.value || '';
    const range = params.range || '';

    return `
      <div class="param-group sheets-group">
        <label>📊 Google Sheets</label>
        <div class="sheets-fields">
          <input type="text" 
                 class="param-input" 
                 data-node-index="${index}" 
                 data-param="documentId"
                 value="${docId}"
                 placeholder="Spreadsheet ID">
          <input type="text" 
                 class="param-input" 
                 data-node-index="${index}" 
                 data-param="sheetName"
                 value="${sheetName}"
                 placeholder="Sheet Name">
          <input type="text" 
                 class="param-input" 
                 data-node-index="${index}" 
                 data-param="range"
                 value="${range}"
                 placeholder="Range (e.g., A1:Z100)">
        </div>
      </div>
    `;
  }

  renderEmailParams(params, index) {
    return `
      <div class="param-group">
        <label>📧 To</label>
        <input type="email" 
               class="param-input" 
               data-node-index="${index}" 
               data-param="toEmail"
               value="${params.toEmail || ''}">
      </div>
      <div class="param-group">
        <label>📝 Subject</label>
        <input type="text" 
               class="param-input" 
               data-node-index="${index}" 
               data-param="subject"
               value="${params.subject || ''}">
      </div>
    `;
  }

  renderAIParams(params, index) {
    return `
      <div class="param-group ai-group">
        <label>🤖 System Message / Tone</label>
        <textarea class="param-textarea" 
                  data-node-index="${index}" 
                  data-param="systemMessage"
                  rows="4"
                  placeholder="You are a helpful assistant...">${params.systemMessage || ''}</textarea>
      </div>
      <div class="param-group ai-group">
        <label>💬 Prompt</label>
        <textarea class="param-textarea" 
                  data-node-index="${index}" 
                  data-param="prompt"
                  rows="4"
                  placeholder="Enter your prompt...">${params.prompt || ''}</textarea>
      </div>
    `;
  }

  renderTriggersTab() {
    const triggerNodes = this.modifiedNodes.filter(n => 
      n.type.includes('trigger') || 
      n.type.includes('cron') || 
      n.type.includes('schedule')
    );

    if (triggerNodes.length === 0) {
      return '<p class="no-triggers">No trigger nodes found in this workflow</p>';
    }

    return `
      <div class="triggers-list">
        <h3>Trigger Nodes (${triggerNodes.length})</h3>
        ${triggerNodes.map(node => this.renderTriggerCard(node)).join('')}
      </div>
    `;
  }

  renderTriggerCard(node) {
    const params = node.parameters || {};
    const cronExpr = params.rule?.interval?.[0]?.expression || 
                     params.cronExpression || 
                     '0 * * * *';

    return `
      <div class="trigger-card" data-node-id="${node.id}">
        <div class="trigger-header">
          <span class="trigger-icon">⏰</span>
          <h4>${node.name}</h4>
          <span class="trigger-type">${node.type}</span>
        </div>
        
        <div class="trigger-params">
          <div class="param-group">
            <label>Cron Expression</label>
            <input type="text" 
                   class="cron-input" 
                   data-node-id="${node.id}"
                   value="${cronExpr}"
                   placeholder="* * * * *">
            <small>Format: minute hour day month weekday</small>
          </div>
          
          <div class="cron-presets">
            <button class="preset-btn" data-cron="0 * * * *">Every Hour</button>
            <button class="preset-btn" data-cron="0 */6 * * *">Every 6 Hours</button>
            <button class="preset-btn" data-cron="0 0 * * *">Daily at Midnight</button>
            <button class="preset-btn" data-cron="0 9 * * *">Daily at 9 AM</button>
            <button class="preset-btn" data-cron="0 0 * * 0">Weekly (Sunday)</button>
            <button class="preset-btn" data-cron="0 0 1 * *">Monthly (1st)</button>
          </div>
        </div>
      </div>
    `;
  }

  renderConnectionsTab() {
    const credentialsList = this.credentials.map(cred => `
      <div class="credential-item">
        <span class="cred-name">${cred.name}</span>
        <span class="cred-type">${cred.type}</span>
        <span class="cred-id">${cred.id}</span>
      </div>
    `).join('');

    return `
      <div class="connections-list">
        <h3>Available Credentials (${this.credentials.length})</h3>
        <div class="credentials-grid">
          ${credentialsList || '<p>No credentials found</p>'}
        </div>
      </div>
    `;
  }

  renderJsonTab() {
    const json = JSON.stringify(this.workflow, null, 2);
    return `
      <div class="json-viewer">
        <h3>Workflow JSON</h3>
        <textarea class="json-editor" rows="20">${json}</textarea>
        <button class="btn btn-secondary" onclick="this.applyJsonChanges()">Apply JSON Changes</button>
      </div>
    `;
  }

  attachEventListeners() {
    // Tab switching
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Parameter inputs
    this.container.querySelectorAll('.param-input, .param-select, .param-textarea').forEach(input => {
      input.addEventListener('change', (e) => this.handleParameterChange(e));
    });

    // Cron inputs
    this.container.querySelectorAll('.cron-input').forEach(input => {
      input.addEventListener('change', (e) => this.handleCronChange(e));
    });

    // Cron presets
    this.container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cronExpr = e.target.dataset.cron;
        const triggerCard = e.target.closest('.trigger-card');
        const input = triggerCard.querySelector('.cron-input');
        input.value = cronExpr;
        input.dispatchEvent(new Event('change'));
      });
    });

    // Close button
    this.container.querySelector('.btn-secondary')?.addEventListener('click', () => this.close());
    
    // Save button
    this.container.querySelector('.btn-primary')?.addEventListener('click', () => this.save());
  }

  switchTab(tabName) {
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    this.container.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
  }

  handleParameterChange(e) {
    const nodeIndex = parseInt(e.target.dataset.nodeIndex);
    const paramName = e.target.dataset.param;
    const value = e.target.value;

    if (!this.modifiedNodes[nodeIndex]) return;

    // Handle special cases
    if (paramName === 'documentId') {
      this.modifiedNodes[nodeIndex].parameters.documentId = { value, mode: 'id' };
    } else if (paramName === 'sheetName') {
      this.modifiedNodes[nodeIndex].parameters.sheetName = { value };
    } else {
      this.modifiedNodes[nodeIndex].parameters[paramName] = value;
    }

    this.updateNodeCard(nodeIndex);
  }

  handleCronChange(e) {
    const nodeId = e.target.dataset.nodeId;
    const cronExpr = e.target.value;

    const nodeIndex = this.modifiedNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    const node = this.modifiedNodes[nodeIndex];
    
    if (node.parameters.rule?.interval) {
      node.parameters.rule.interval[0].expression = cronExpr;
    } else if (node.parameters.cronExpression !== undefined) {
      node.parameters.cronExpression = cronExpr;
    } else {
      node.parameters.rule = {
        interval: [{ field: 'cronExpression', expression: cronExpr }]
      };
    }
  }

  updateNodeCard(nodeIndex) {
    const node = this.modifiedNodes[nodeIndex];
    const card = this.container.querySelector(`[data-node-index="${nodeIndex}"]`);
    if (card) {
      card.classList.add('modified');
      if (!card.querySelector('.modified-badge')) {
        card.querySelector('.node-header').insertAdjacentHTML(
          'beforeend',
          '<span class="modified-badge">Modified</span>'
        );
      }
    }
  }

  isNodeModified(nodeId) {
    const original = this.originalNodes.find(n => n.id === nodeId);
    const modified = this.modifiedNodes.find(n => n.id === nodeId);
    return JSON.stringify(original) !== JSON.stringify(modified);
  }

  async save() {
    try {
      this.showLoading('Saving changes...');
      
      const updatedWorkflow = {
        ...this.workflow,
        nodes: this.modifiedNodes
      };

      await updateWorkflow(this.workflowId, updatedWorkflow);
      
      this.originalNodes = JSON.parse(JSON.stringify(this.modifiedNodes));
      this.showSuccess('Changes saved successfully!');
      this.render();
    } catch (error) {
      this.showError(`Failed to save: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  applyJsonChanges() {
    try {
      const jsonText = this.container.querySelector('.json-editor').value;
      const updatedWorkflow = JSON.parse(jsonText);
      
      this.workflow = updatedWorkflow;
      this.modifiedNodes = JSON.parse(JSON.stringify(updatedWorkflow.nodes));
      
      this.switchTab('nodes');
      this.render();
      this.showSuccess('JSON changes applied');
    } catch (error) {
      this.showError(`Invalid JSON: ${error.message}`);
    }
  }

  getNodeTypeIcon(type) {
    const icons = {
      'httpRequest': '🌐',
      'googleSheets': '📊',
      'gmail': '📧',
      'email': '📧',
      'openAi': '🤖',
      'anthropic': '🤖',
      'trigger': '⏰',
      'cron': '⏰',
      'schedule': '⏰',
      'webhook': '🔗',
      'set': '⚙️',
      'function': '⚡',
      'if': '🔀',
      'switch': '🔀'
    };

    for (const [key, icon] of Object.entries(icons)) {
      if (type.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return '📦';
  }

  showLoading(message) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="loading-spinner"></div><p>${message}</p>`;
    this.container.appendChild(overlay);
  }

  hideLoading() {
    const overlay = this.container.querySelector('.loading-overlay');
    if (overlay) overlay.remove();
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }, 100);
  }

  close() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
