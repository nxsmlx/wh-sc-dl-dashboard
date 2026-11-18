#!/usr/bin/env bash
# One-time VPS preparation. Run this ON the VPS after cloning the repo:
#   bash scripts/vps-setup.sh
#
# It creates the deploy key GitHub Actions will use, prints the public key to
# add as a deploy key, and checks Docker is ready.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/stacks/wh-sc-dl-dashboard}"
KEY="${KEY:-$HOME/.ssh/github_deploy}"

echo "== 1. Docker =="
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install it first:"
  echo "  curl -fsSL https://get.docker.com | sh"
  exit 1
fi
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin missing"; exit 1; }
echo "docker $(docker --version | cut -d' ' -f3) ok"

echo
echo "== 2. App directory =="
if [ ! -d "$APP_DIR" ]; then
  echo "Creating $APP_DIR"
  mkdir -p "$APP_DIR"
  echo "Clone the repo into it, then run this script again:"
  echo "  cd $APP_DIR && git clone git@github.com:nxsmlx/wh-sc-dl-dashboard.git ."
  exit 0
fi
cd "$APP_DIR"
[ -f docker-compose.yml ] || { echo "$APP_DIR does not contain docker-compose.yml"; exit 1; }
echo "$APP_DIR ok"

echo
echo "== 3. Environment file =="
if [ ! -f .env ]; then
  cp env.example .env
  echo "Created .env — SET THESE NOW:"
  echo "  nano $APP_DIR/.env"
  echo "    ADMIN_PASSWORD=<kata laluan kuat untuk /admin>"
  echo "    SESSION_SECRET=<benda rawak panjang>"
  echo "    INGEST_TOKEN=<token untuk watcher workbook>"
  echo
  echo "Generate secure values with:"
  echo "  openssl rand -hex 24"
else
  echo ".env already exists (not touched)"
fi

echo
echo "== 4. Deploy key for GitHub Actions =="
if [ -f "$KEY" ]; then
  echo "Key already exists at $KEY"
else
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$KEY" -N "" >/dev/null
  echo "Created $KEY"
fi
touch "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"
if ! grep -qF "$(cat "$KEY.pub")" "$HOME/.ssh/authorized_keys"; then
  cat "$KEY.pub" >> "$HOME/.ssh/authorized_keys"
  echo "Public key added to authorized_keys"
fi

echo
echo "== 5. Values for GitHub secrets =="
echo "VPS_HOST      = 194.233.80.157"
echo "VPS_USER      = root"
echo "VPS_APP_DIR   = $APP_DIR"
echo
echo "VPS_SSH_KEY — paste everything between the BEGIN and END lines:"
echo "----------------------------------------------------------------"
cat "$KEY"
echo "----------------------------------------------------------------"

echo
echo "Next: add the secrets above in GitHub, then on your PC run: npm run ship"
