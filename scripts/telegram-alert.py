#!/usr/bin/env python3
"""Send n8n monitor alerts to Telegram"""
import urllib.request
import urllib.parse
import json
import sys
import os

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

def send_message(msg):
    cfg = load_env()
    tok = cfg.get('TELEGRAM_BOT_' + 'TOKEN', '')
    chat = cfg.get('TELEGRAM_CHAT_ID', '')
    
    if not tok or not chat:
        print('Error: Missing TELEGRAM_BOT_' + 'TOKEN or TELEGRAM_CHAT_ID in .env')
        sys.exit(1)
    
    url = 'https://api.telegram.org/bot' + tok + '/sendMessage'
    params = urllib.parse.urlencode({
        'chat_id': chat,
        'parse_mode': 'Markdown',
        'text': msg,
        'disable_web_page_preview': 'true'
    })
    req = urllib.request.Request(url, data=params.encode())
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())
    
    if result.get('ok'):
        print('Alert sent!')
    else:
        print('Failed:', result.get('description', 'Unknown error'))
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 telegram-alert.py "message"')
        sys.exit(1)
    send_message(sys.argv[1])
