#!/usr/bin/env python3
"""
N8N Dashboard Daily Monitor
Runs daily to check workflow health and send alerts
"""
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

# Configuration
N8N_BASE_URL = os.environ.get('N8N_BASE_URL', 'https://websiseo.app.n8n.cloud/api/v1')
N8N_API_KEY = os.environ.get('N8N_API_KEY', '')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')
EMAIL_TO = os.environ.get('MONITOR_EMAIL_TO', 'service@maximo-seo.com')
DASHBOARD_URL = 'https://n8n-dashboard-3229.onrender.com'

def api_get(endpoint):
    """Make GET request to n8n API"""
    url = f"{N8N_BASE_URL}/{endpoint}"
    req = urllib.request.Request(url, headers={
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"API Error ({endpoint}): {e}", file=sys.stderr)
        return None

def fetch_workflows():
    """Fetch all workflows"""
    data = api_get('workflows?limit=250')
    return data.get('data', []) if data else []

def fetch_executions(limit=100):
    """Fetch recent executions (n8n cloud max 100 per request)"""
    all_execs = []
    cursor = None
    pages = min(limit // 100, 5)  # Max 5 pages = 500 executions
    
    for _ in range(pages):
        url = f'executions?limit=100'
        if cursor:
            url += f'&cursor={cursor}'
        data = api_get(url)
        if not data:
            break
        execs = data.get('data', [])
        all_execs.extend(execs)
        cursor = data.get('nextCursor')
        if not cursor or len(execs) < 100:
            break
    
    return all_execs

def analyze_workflows(workflows, executions):
    """Analyze workflows for issues"""
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    
    report = {
        'date': now.isoformat(),
        'total_workflows': len(workflows),
        'active_workflows': sum(1 for w in workflows if w.get('active')),
        'not_ran_today': [],
        'not_ran_week': [],
        'low_success_rate': [],
        'failed_recently': [],
        'never_ran': [],
    }
    
    # Build execution index
    exec_by_wf = {}
    for ex in executions:
        wf_id = ex.get('workflowId')
        if wf_id not in exec_by_wf:
            exec_by_wf[wf_id] = []
        exec_by_wf[wf_id].append(ex)
    
    for wf in workflows:
        if not wf.get('active'):
            continue
        
        wf_id = wf['id']
        wf_name = wf.get('name', 'Unknown')
        wf_execs = exec_by_wf.get(wf_id, [])
        
        if not wf_execs:
            report['never_ran'].append({'id': wf_id, 'name': wf_name})
            report['not_ran_today'].append({'id': wf_id, 'name': wf_name})
            report['not_ran_week'].append({'id': wf_id, 'name': wf_name})
            continue
        
        # Sort by date descending
        wf_execs.sort(key=lambda x: x.get('startedAt', ''), reverse=True)
        last_exec = wf_execs[0]
        last_date = datetime.fromisoformat(last_exec['startedAt'].replace('Z', '+00:00'))
        
        # Check if ran today
        if last_date < yesterday:
            report['not_ran_today'].append({
                'id': wf_id, 'name': wf_name,
                'last_run': last_exec['startedAt'],
                'status': last_exec.get('status', 'unknown')
            })
        
        # Check if ran this week
        if last_date < week_ago:
            report['not_ran_week'].append({
                'id': wf_id, 'name': wf_name,
                'last_run': last_exec['startedAt']
            })
        
        # Check success rate (last 7 days)
        week_execs = [e for e in wf_execs 
                      if datetime.fromisoformat(e['startedAt'].replace('Z', '+00:00')) > week_ago]
        if week_execs:
            success = sum(1 for e in week_execs if e.get('status') == 'success')
            rate = (success / len(week_execs)) * 100
            if rate < 90:
                report['low_success_rate'].append({
                    'id': wf_id, 'name': wf_name,
                    'rate': round(rate, 1),
                    'total': len(week_execs),
                    'success': success
                })
        
        # Check recent failures
        recent_fails = [e for e in wf_execs[:5] 
                       if e.get('status') in ('error', 'failed')]
        if len(recent_fails) >= 3:
            report['failed_recently'].append({
                'id': wf_id, 'name': wf_name,
                'failures': len(recent_fails),
                'last_error': recent_fails[0].get('startedAt', '')
            })
    
    return report

def format_telegram_message(report):
    """Format report for Telegram"""
    issues = []
    
    if report['failed_recently']:
        issues.append(f"🚨 *{len(report['failed_recently'])} workflows נכשלו לאחרונה*")
        for wf in report['failed_recently'][:5]:
            issues.append(f"  ❌ {wf['name']} ({wf['failures']} failures)")
    
    if report['not_ran_today']:
        active_count = report['active_workflows']
        issues.append(f"\n⚠️ *{len(report['not_ran_today'])}/{active_count} active workflows לא רצו היום*")
        for wf in report['not_ran_today'][:5]:
            issues.append(f"  ⏸ {wf['name']}")
        if len(report['not_ran_today']) > 5:
            issues.append(f"  ... ועוד {len(report['not_ran_today']) - 5}")
    
    if report['low_success_rate']:
        issues.append(f"\n📉 *{len(report['low_success_rate'])} workflows עם success rate נמוך*")
        for wf in report['low_success_rate'][:5]:
            issues.append(f"  📊 {wf['name']}: {wf['rate']}% ({wf['success']}/{wf['total']})")
    
    if report['never_ran']:
        issues.append(f"\n⚪ *{len(report['never_ran'])} active workflows מעולם לא רצו*")
    
    if not issues:
        return f"✅ *n8n Daily Report*\n\nהכל תקין! כל {report['active_workflows']} ה-workflows הפעילים רצו כרגיל.\n\n📊 Dashboard: {DASHBOARD_URL}"
    
    header = f"🚨 *n8n Daily Report - {report['date'][:10]}*\n"
    footer = f"\n📊 Dashboard: {DASHBOARD_URL}"
    return header + '\n'.join(issues) + footer

def send_telegram(message):
    """Send message via Telegram"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram not configured, skipping", file=sys.stderr)
        return False
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = json.dumps({
        'chat_id': TELEGRAM_CHAT_ID,
        'text': message,
        'parse_mode': 'Markdown'
    }).encode()
    
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req, timeout=10)
        print("Telegram message sent successfully")
        return True
    except Exception as e:
        print(f"Telegram error: {e}", file=sys.stderr)
        return False

def main():
    print(f"=== N8N Daily Monitor - {datetime.now().isoformat()} ===")
    
    if not N8N_API_KEY:
        print("ERROR: N8N_API_KEY not set", file=sys.stderr)
        sys.exit(1)
    
    print("Fetching workflows...")
    workflows = fetch_workflows()
    print(f"Found {len(workflows)} workflows")
    
    print("Fetching executions...")
    executions = fetch_executions()
    print(f"Found {len(executions)} executions")
    
    print("Analyzing...")
    report = analyze_workflows(workflows, executions)
    
    # Print summary
    print(f"\n=== Report Summary ===")
    print(f"Total workflows: {report['total_workflows']}")
    print(f"Active workflows: {report['active_workflows']}")
    print(f"Not ran today: {len(report['not_ran_today'])}")
    print(f"Not ran this week: {len(report['not_ran_week'])}")
    print(f"Low success rate: {len(report['low_success_rate'])}")
    print(f"Failed recently: {len(report['failed_recently'])}")
    print(f"Never ran: {len(report['never_ran'])}")
    
    # Send Telegram alert
    has_issues = (report['failed_recently'] or report['not_ran_today'] or 
                  report['low_success_rate'] or report['never_ran'])
    
    if has_issues or True:  # Always send daily report
        message = format_telegram_message(report)
        send_telegram(message)
    
    # Save report to file
    report_path = os.path.join(os.path.dirname(__file__), '..', 'reports', 
                               f"daily-{report['date'][:10]}.json")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\nReport saved to {report_path}")
    
    # Exit with error code if critical issues found
    if report['failed_recently']:
        sys.exit(2)
    
    print("\n=== Monitor completed successfully ===")

if __name__ == '__main__':
    main()
