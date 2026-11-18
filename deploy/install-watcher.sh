#!/usr/bin/env bash
# One-time setup: install the workbook watcher as a systemd user service so it
# restarts itself and survives logout (with lingering enabled).
#
# Run from the project directory:
#   bash deploy/install-watcher.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONF_DIR="$HOME/.config/wh-wallboard"
ENV_FILE="$CONF_DIR/ingest.env"
UNIT_FILE="$HOME/.config/systemd/user/wallboard-watch.service"

echo "== 1. Credentials file =="
mkdir -p "$CONF_DIR"
DEFAULT_WORKBOOK='/mnt/c/Users/nandh/OneDrive - Hong Leong Yamaha Motor Sdn Bhd/SP - Documents/WH_OUTBOUND/Dashboard for SC and Delivery Data.xlsx'
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
# Workbook the board should follow. Quoted because the path contains spaces.
WORKBOOK="$DEFAULT_WORKBOOK"
INTERVAL_SECONDS=30

# Where to send the imported snapshot.
INGEST_URL=
INGEST_TOKEN=
EOF
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE"
else
  echo "Using existing $ENV_FILE"
fi

if ! grep -qE '^WORKBOOK=.+' "$ENV_FILE"; then
  echo "WORKBOOK=\"$DEFAULT_WORKBOOK\"" >> "$ENV_FILE"
fi

if ! grep -qE '^INGEST_URL=.+' "$ENV_FILE" || ! grep -qE '^INGEST_TOKEN=.+' "$ENV_FILE"; then
  echo
  echo "Fill these in, then run this script again:"
  echo "  nano $ENV_FILE"
  echo "    INGEST_URL=http://194.233.80.157:8080/api/dashboard"
  echo "    INGEST_TOKEN=<same value as the VPS .env>"
  exit 0
fi

echo
echo "== 2. Install the service =="
NODE_BIN="$(dirname "$(command -v node)")"
if [ -z "$NODE_BIN" ]; then
  echo "node is not on PATH. Open a new terminal and try again."
  exit 1
fi
mkdir -p "$(dirname "$UNIT_FILE")"
sed -e "s#%h/.t3/projects/wh-sc-dl-dashboard#$PROJECT_DIR#" \
    -e "s#%h/.nvm/versions/node/v26.13.1/bin#$NODE_BIN#" \
  "$PROJECT_DIR/deploy/wallboard-watch.service" > "$UNIT_FILE"
systemctl --user daemon-reload
systemctl --user enable --now wallboard-watch.service
echo "Service installed (node from $NODE_BIN)."

echo
echo "== 3. Keep it running without an open terminal =="
if command -v loginctl >/dev/null 2>&1; then
  sudo loginctl enable-linger "$USER" 2>/dev/null \
    && echo "Lingering enabled." \
    || echo "Could not enable lingering (needs sudo). The watcher stops when you log out."
fi

echo
echo "== 4. Status =="
systemctl --user --no-pager status wallboard-watch.service | head -12
echo
echo "Watch the log with:"
echo "  journalctl --user -u wallboard-watch -f"
echo "  tail -f $PROJECT_DIR/logs/workbook-watch.log"
