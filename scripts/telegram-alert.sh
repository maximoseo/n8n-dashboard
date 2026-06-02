#!/bin/bash
# n8n Monitor Telegram Alert Script
# Usage: ./telegram-alert.sh "Your message here"

BOT_TOKEN="${TE...CHAT_ID="${TE...MSG="$1"

if [ -z "$MSG" ]; then
  echo "Usage: $0 <message>"
  exit 1
fi

# Send to Telegram
RESULT=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "parse_mode=Markdown" \
  -d "text=${MSG}")

# Check result
echo "$RESULT" | python3 -c "
import sys, json
r = json.load(sys.stdin)
if r.get('ok'):
    print('✅ Alert sent successfully!')
else:
    print(f'❌ Failed: {r.get(\"description\", \"Unknown error\")}')
"
