#!/usr/bin/env bash
# Start ngrok + stripe listen + next dev for local Stripe checkout testing.
# Usage: ./scripts/dev-full.sh
set -euo pipefail

ENV_FILE="$(readlink -f apps/web/.env 2>/dev/null || realpath apps/web/.env)"
WEBHOOK_ENDPOINT="http://localhost:3000/api/integrations/stripe/webhook"

cleanup() {
  echo ""
  echo "Shutting down..."
  [[ -n "${NGROK_PID:-}" ]] && kill "$NGROK_PID" 2>/dev/null
  [[ -n "${STRIPE_PID:-}" ]] && kill "$STRIPE_PID" 2>/dev/null
  # Restore original values
  if [[ -n "${ORIGINAL_APP_URL:-}" ]]; then
    sed -i '' "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=${ORIGINAL_APP_URL}|" "$ENV_FILE"
    echo "Restored NEXT_PUBLIC_APP_URL"
  fi
  exit 0
}
trap cleanup INT TERM

# Save original values
ORIGINAL_APP_URL=$(grep '^NEXT_PUBLIC_APP_URL=' "$ENV_FILE" | cut -d= -f2- || echo "http://localhost:3000")

# --- 1. Start ngrok ---
echo "Starting ngrok on port 3000..."
ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to be ready (polls the local API)
echo "Waiting for ngrok tunnel..."
for i in $(seq 1 30); do
  NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
    | grep -o '"public_url":"https://[^"]*"' \
    | head -1 \
    | cut -d'"' -f4) || true
  if [[ -n "${NGROK_URL:-}" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "${NGROK_URL:-}" ]]; then
  echo "ERROR: Could not get ngrok URL after 30s. Check ngrok auth: ngrok config check"
  kill "$NGROK_PID" 2>/dev/null
  exit 1
fi

echo "ngrok tunnel: $NGROK_URL"

# --- 2. Update .env with ngrok URL ---
if grep -q '^NEXT_PUBLIC_APP_URL=' "$ENV_FILE"; then
  sed -i '' "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=${NGROK_URL}|" "$ENV_FILE"
else
  echo "NEXT_PUBLIC_APP_URL=${NGROK_URL}" >> "$ENV_FILE"
fi
echo "Updated NEXT_PUBLIC_APP_URL in .env"

# --- 3. Start Stripe CLI webhook forwarding ---
echo "Starting stripe listen -> $WEBHOOK_ENDPOINT"
stripe listen --forward-to "$WEBHOOK_ENDPOINT" &
STRIPE_PID=$!

# Give stripe a moment to print the webhook signing secret
sleep 3
echo ""
echo "============================================"
echo "  ngrok:  $NGROK_URL"
echo "  stripe: forwarding to $WEBHOOK_ENDPOINT"
echo ""
echo "  NOTE: Copy the whsec_... secret from above"
echo "  into .env as STRIPE_WEBHOOK_SECRET if needed."
echo "============================================"
echo ""

# --- 4. Start Next.js dev server ---
cd apps/web && bun run dev
