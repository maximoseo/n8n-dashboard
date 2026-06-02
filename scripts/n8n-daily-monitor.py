#!/usr/bin/env python3
"""Daily n8n health monitor - sends report to Telegram"""
import urllib.request
import json
import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.expanduser('~/n8n-dashboard/scripts'))
from importlib import import_module
telegram_alert = import_module('telegram-alert')

def load_env():
    env_path = os.path.expanduser('~/n8n-dashboard/.env')
    config = {}
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                config[k.strip()] = v.strip()
    return config

def n8n_api(endpoint, params=None):
    cfg = load_env()
    base = cfg.get('N8N_BASE_URL', 'https://websiseo.app.n8n.cloud')
    api_key = cfg.get('N8N_API_KEY', '')
    url = base + '/api/v1/' + endpoint
    if params:
        url += '?' + '&'.join(f'{k}={v}' for k, v in params.items())
    req = urllib.request.Request(url)
    req.add_header('X-N8N-API-KEY', api_key)
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read())

def main():
    try:
        # Fetch workflows
        workflows = n8n_api('workflows', {'limit': '250'})
        wf_list = workflows.get('data', [])
        active = [w for w in wf_list if w.get('active')]
        inactive = [w for w in wf_list if not w.get('active')]
        
        # Fetch recent executions
        executions = n8n_api('executions', {'limit': '100'})
        exec_list = executions.get('data', [])
        
        # Calculate stats
        success = [e for e in exec_list if e.get('status') == 'success']
        failed = [e for e in exec_list if e.get('status') == 'error']
        success_rate = len(success) / len(exec_list) * 100 if exec_list else 0
        
        # Find problematic workflows
        failed_wf_ids = set(e.get('workflowId') for e in failed)
        failed_wfs = [w for w in wf_list if w.get('id') in failed_wf_ids]
        
        # Build report
        now = datetime.now(timezone(timedelta(hours=3)))
        report = f"""📊 *n8n Daily Report*
🗓️ {now.strftime('%Y-%m-%d %H:%M')} IST

*Overview:*
• Total Workflows: {len(wf_list)}
• Active: {len(active)}
• Inactive: {len(inactive)}

*Recent Executions (last 100):*
• ✅ Success: {len(success)} ({success_rate:.1f}%)
• ❌ Failed: {len(failed)}"""
        
        if failed_wfs:
            report += f'\n\n⚠️ *Workflows with Failures:*'
            for w in failed_wfs[:5]:
                report += f'\n• {w.get("name", "Unknown")} (ID: {w.get("id")})'
            if len(failed_wfs) > 5:
                report += f'\n_...and {len(failed_wfs) - 5} more_'
        
        report += '\n\n🔗 [Dashboard](https://n8n-dashboard-3229.onrender.com)'
        report += '\n🔗 [n8n](https://websiseo.app.n8n.cloud)'
        
        telegram_alert.send_message(report)
        print(f'Report sent: {len(wf_list)} workflows, {len(failed)} failed executions')
        
    except Exception as e:
        error_msg = f'❌ *n8n Monitor Error*\n\n{str(e)}'
        try:
            telegram_alert.send_message(error_msg)
        except:
            pass
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
