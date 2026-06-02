#!/bin/bash
# Load .env
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null

BOT_TOKEN="${TE...
CHAT_ID="${TE...
MSG="$1"

if [ -z "$MSG" ]; then
  echo "Usage: telegram-send.sh <message>"
  exit 1
fi

curl -s "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d chat_id="$CHAT_ID" \
  -d parse_mode=Markdown \
  -d text="$MSG" | python3 -c "import sys,json; r=json.load(sys.stdin); print('✅ Sent!' if r.get('ok') else f'❌ FAIL: {r}')"
