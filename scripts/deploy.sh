#!/usr/bin/env bash
#
# Direct deploy to Vercel (no GitHub connection needed).
# Shows exactly which workspace + project the code is going to, then deploys.
#
# Usage:
#   ./scripts/deploy.sh          # deploy to PRODUCTION
#   ./scripts/deploy.sh preview  # deploy a preview build
#
set -euo pipefail

cd "$(dirname "$0")/.."

TARGET="${1:-production}"

# --- read the linked project so we can show where this is going ---
PROJECT_JSON=".vercel/project.json"
if [ ! -f "$PROJECT_JSON" ]; then
  echo "✗ Not linked to a Vercel project (.vercel/project.json missing)."
  echo "  Run: vercel link"
  exit 1
fi

PROJECT_NAME=$(grep -o '"projectName":"[^"]*"' "$PROJECT_JSON" | cut -d'"' -f4)
PROJECT_ID=$(grep -o '"projectId":"[^"]*"' "$PROJECT_JSON" | cut -d'"' -f4)
ORG_ID=$(grep -o '"orgId":"[^"]*"' "$PROJECT_JSON" | cut -d'"' -f4)
WHO=$(vercel whoami 2>/dev/null || echo "unknown")

echo "────────────────────────────────────────────────"
echo "  Deploying to Vercel"
echo "────────────────────────────────────────────────"
echo "  Logged in as : $WHO"
echo "  Workspace    : Vinnet's projects (vinnets-projects-1b5315e5)"
echo "  Project      : $PROJECT_NAME"
echo "  Project ID   : $PROJECT_ID"
echo "  Org ID       : $ORG_ID"
echo "  Target       : $TARGET"
echo "  Live URL     : https://ulrich-propiedades.vercel.app"
echo "────────────────────────────────────────────────"
read -r -p "  Proceed? [y/N] " ok
[[ "$ok" =~ ^[Yy]$ ]] || { echo "  Aborted."; exit 0; }

if [ "$TARGET" = "production" ]; then
  vercel --prod
else
  vercel
fi
