#!/usr/bin/env bash
# =============================================================================
# deploy-frontend.sh — Build React app and upload to S3
# Run from your LOCAL machine after filling in the variables below.
# =============================================================================
set -euo pipefail

# ── CONFIGURE THESE ──────────────────────────────────────────────────────────
EC2_ELASTIC_IP="CHANGE_ME"               # e.g. 13.233.12.45
S3_BUCKET="CHANGE_ME"                    # e.g. tnp-frontend-production
CF_DISTRIBUTION_ID="CHANGE_ME"          # e.g. E1ABCDEFGHIJK
AWS_PROFILE="${AWS_PROFILE:-default}"
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "==> [1/4] Writing .env.production"
cat > "$FRONTEND_DIR/.env.production" <<EOF
VITE_API_BASE_URL=http://${EC2_ELASTIC_IP}/api/v1
EOF

echo "==> [2/4] Installing frontend dependencies"
cd "$FRONTEND_DIR"
npm ci

echo "==> [3/4] Building React app"
npm run build

echo "==> [4/4] Uploading dist/ to s3://${S3_BUCKET}/"
aws s3 sync dist/ "s3://${S3_BUCKET}/" \
  --delete \
  --profile "$AWS_PROFILE" \
  --region ap-south-1

echo "==> Invalidating CloudFront cache"
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "/*" \
  --profile "$AWS_PROFILE" \
  --region ap-south-1

echo ""
echo "✅  Frontend deployed!"
echo "    CloudFront URL: https://${CF_DISTRIBUTION_ID}.cloudfront.net (propagation takes ~5 min)"
