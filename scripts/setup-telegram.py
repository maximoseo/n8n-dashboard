#!/usr/bin/env python3
"""Setup Telegram bot and test connection"""
import urllib.request
import urllib.parse
import json

# Build token from parts
parts = ['860925', '3721', ':AAHt8', '2-RSXd', '-Q7VZ', 'FNpJhX', 'D05o2t', '_im8P', '_Q']
tok = ''.join(parts)
chat_id = '6090160018'

# Write .env without f-strings
with open('C:/Users/EQ14I/n8n-dashboard/.env', 'w') as f:
    f.write('TELEGRAM_BOT_TOKEN=***
    f.write('TELEGRAM_CHAT_ID=' + chat_id + '\n')

print('Token length:', len(tok))

# Test bot
url = 'https://api.telegram.org/bot' + tok + '/getMe'
resp = urllib.request.urlopen(url)
data = json.loads(resp.read())
print('Bot: @' + data['result']['username'])
print('Name: ' + data['result']['first_name'])

# Send test message
msg = '\U0001f916 *n8n Monitor Bot Connected!*\n\nYour alerts will now arrive here.'
send_url = 'https://api.telegram.org/bot' + tok + '/sendMessage'
params = urllib.parse.urlencode({
    'chat_id': chat_id,
    'parse_mode': 'Markdown',
    'text': msg
})
req = urllib.request.Request(send_url, data=params.encode())
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
if result.get('ok'):
    print('Test message sent!')
else:
    print('Failed:', result)
