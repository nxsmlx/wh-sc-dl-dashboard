#!/usr/bin/env bash
# Turn the workbook watcher on in one step.
#
#   bash deploy/enable-watcher.sh <INGEST_TOKEN>
#
# Everything else is already known: the workbook path on this PC, a 30 second
# poll, and the VPS address. Re-run it any time; it is safe to repeat.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONF_DIR="$HOME/.config/wh-wallboard"
ENV_FILE="$CONF_DIR/ingest.env"
UNIT_FILE="$HOME/.config/systemd/user/wallboard-watch.service"
VPS_BOARD="${VPS_BOARD:-http://194.233.80.157:8080}"
WORKBOOK_PATH='/mnt/c/Users/nandh/OneDrive - Hong Leong Yamaha Motor Sdn Bhd/SP - Documents/WH_OUTBOUND/Dashboard for SC and Delivery Data.xlsx'

TOKEN="${1:-}"
if [ -z "$TOKEN" ]; then
  echo "Usage: bash deploy/enable-watcher.sh <INGEST_TOKEN>"
  echo "The token is the INGEST_TOKEN value from the VPS .env file."
  exit 1
fi

echo "== 1. Check the board answers =="
if ! curl -fsS -m 8 -o /dev/null "$VPS_BOARD/api/state"; then
  echo "The board at $VPS_BOARD does not answer yet."
  echo "Finish the VPS deploy first, then run this again."
  exit 1
fi
echo "Board reachable."

echo
echo "== 2. Check the token is accepted =="
PAYLOAD='{"lastUpdatedAt":"2000-01-01T00:00:00.000Z","selectedMonth":"2000-01-01","shipping":{},"delivery":{}}'
STATUS=$(curl -s -o /dev/null -w '%{http_code}' -m 10 \
  -X POST -H 'content-type: application/json' -H "x-ingest-token: $TOKEN" \
  -d "$PAYLOAD" "$VPS_BOARD/api/dashboard")
case "$STATUS" in
  200|409) echo "Token accepted." ;;
  401) echo "Token rejected (401). Check INGEST_TOKEN in the VPS .env."; exit 1 ;;
  *) echo "Unexpected answer ($STATUS). Check the VPS logs."; exit 1 ;;
esac

echo
echo "== 3. Write the credentials file =="
mkdir -p "$CONF_DIR"
cat > "$ENV_FILE" <<EOF
WORKBOOK="$WORKBOOK_PATH"
INTERVAL_SECONDS=30
INGEST_URL=$VPS_BOARD/api/dashboard
INGEST_TOKEN=$TOKEN
EOF
chmod 600 "$ENV_FILE"
echo "$ENV_FILE written."

echo
echo "== 4. Install and start the service =="
NODE_BIN="$(dirname "$(command -v node)")"
mkdir -p "$(dirname "$UNIT_FILE")"
sed -e "s#%h/.t3/projects/wh-sc-dl-dashboard#$PROJECT_DIR#" \
    -e "s#%h/.nvm/versions/node/v26.13.1/bin#$NODE_BIN#" \
  "$PROJECT_DIR/deploy/wallboard-watch.service" > "$UNIT_FILE"
systemctl --user daemon-reload
systemctl --user enable --now wallboard-watch.service

echo
echo "== 5. Keep running after logout =="
if loginctl show-user "$USER" -p Linger 2>/dev/null | grep -q 'Linger=yes'; then
  echo "Already enabled."
else
  sudo loginctl enable-linger "$USER" && echo "Enabled." \
    || echo "Skipped (needs sudo). The watcher stops when you log out."
fi

echo
echo "== 6. Result =="
systemctl --user --no-pager status wallboard-watch.service | head -6
echo
tail -3 "$PROJECT_DIR/logs/workbook-watch.log" 2>/dev/null || true
echo
echo "Watcher is on. Logs: journalctl --user -u wallboard-watch -f"
