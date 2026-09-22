#!/usr/bin/env bash
set -euo pipefail

# Hostinger VPS one-command deploy script for webp-converter-90s
# Usage: curl -fsSL https://raw.githubusercontent.com/m-barazi/webp-converter-90s/main/deploy.sh | bash

REPO_URL="https://github.com/m-barazi/webp-converter-90s.git"
INSTALL_DIR="$HOME/webp-converter-90s"
HTTP_PORT="8080"

echo "🖥️  Deploying Photo to WebP Converter (90s edition)..."

# Detect package manager for Docker installation helpers
if command -v apt-get >/dev/null 2>&1; then
  PKG_MGR="apt-get"
elif command -v yum >/dev/null 2>&1; then
  PKG_MGR="yum"
elif command -v dnf >/dev/null 2>&1; then
  PKG_MGR="dnf"
else
  PKG_MGR=""
fi

# Ensure Docker is installed
if ! command -v docker >/dev/null 2>&1; then
  echo "⬇️  Docker not found. Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo systemctl start docker || true
  sudo systemctl enable docker || true
  sudo usermod -aG docker "$(whoami)" || true
  echo "✅ Docker installed. You may need to log out and back in for group changes."
fi

# Ensure Docker Compose is available (plugin or standalone)
if ! docker compose version >/dev/null 2>&1 && ! docker-compose version >/dev/null 2>&1; then
  echo "⬇️  Docker Compose not found. Installing plugin..."
  if [ -n "$PKG_MGR" ]; then
    sudo "$PKG_MGR" update -y || true
    sudo "$PKG_MGR" install -y docker-compose-plugin || true
  fi
fi

# Clone or update repository
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "🔄 Updating existing repository in $INSTALL_DIR..."
  cd "$INSTALL_DIR"
  git pull origin main
else
  echo "⬇️  Cloning repository into $INSTALL_DIR..."
  rm -rf "$INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Build and start container
echo "🐳 Building and starting Docker container on port $HTTP_PORT..."
docker compose down || true
docker compose up --build -d

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 App URL: http://$(hostname -I | awk '{print $1}'):$HTTP_PORT"
echo "   (Replace with your server IP if hostname detection failed.)"
echo ""
echo "🛠️  Useful commands:"
echo "   cd $INSTALL_DIR"
echo "   docker compose logs -f"
echo "   docker compose down"
echo ""
